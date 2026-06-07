import { useEffect, useState, useCallback, useRef } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../services/productoService';
import { getCategorias } from '../services/categoriaService';
import type { Producto } from '../services/productoService';
import type { Categoria } from '../services/categoriaService';

const productoVacio: Producto = {
  categoria_id: 0, nombre: '', descripcion: '',
  precio: 0, stock: 0, stock_minimo: 5
};

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState<Producto>(productoVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const fetchedRef = useRef(false);

  const cargarProductos = useCallback(async (pag = 1) => {
    setCargando(true);
    try {
      const result = await getProductos(pag, 20);
      setProductos(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setPage(result.page);
    } catch {
      setProductos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      cargarProductos(1);
      getCategorias().then(setCategorias);
    }
  }, [cargarProductos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'precio' || name === 'stock' || name === 'stock_minimo' || name === 'categoria_id'
        ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await updateProducto(editandoId, { ...form, estado: 'ACTIVO' });
        setMensaje('Producto actualizado correctamente');
      } else {
        await createProducto(form);
        setMensaje('Producto creado correctamente');
      }
      setForm(productoVacio);
      setEditandoId(null);
      setMostrarForm(false);
      cargarProductos(page);
      setTimeout(() => setMensaje(''), 3000);
    } catch {
      setError('Error al guardar producto');
    }
  };

  const handleEditar = (p: Producto) => {
    setForm(p);
    setEditandoId(p.id!);
    setMostrarForm(true);
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteProducto(id);
      setMensaje('Producto eliminado correctamente');
      cargarProductos(page);
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Gestión de Productos</h1>
            <p className="text-gray-500 text-sm mt-1">GRUPO HACKTHONYPERU S.A.C — {total} productos registrados</p>
          </div>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); setForm(productoVacio); setEditandoId(null); }}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded-lg transition"
          >
            {mostrarForm ? '✕ Cancelar' : '+ Nuevo Producto'}
          </button>
        </div>

        {mensaje && <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">{mensaje}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">{error}</div>}

        {mostrarForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {editandoId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Categoría</label>
                <select name="categoria_id" value={form.categoria_id} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value={0}>Selecciona una categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              {[
                { label: 'Nombre', name: 'nombre', type: 'text' },
                { label: 'Precio (S/.)', name: 'precio', type: 'number' },
                { label: 'Stock', name: 'stock', type: 'number' },
                { label: 'Stock Mínimo', name: 'stock_minimo', type: 'number' },
              ].map(({ label, name, type }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type} name={name} value={(form as any)[name]} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
                <textarea name="descripcion" value={form.descripcion || ''} onChange={handleChange} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="col-span-2 flex justify-end">
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition">
                  {editandoId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                {['ID', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Stock Mín.', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : productos.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay productos registrados</td></tr>
              ) : (
                productos.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">{p.id}</td>
                    <td className="px-4 py-3 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3">{p.categoria_nombre}</td>
                    <td className="px-4 py-3">S/. {Number(p.precio).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock <= (p.stock_minimo || 5) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.stock_minimo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => handleEditar(p)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-xs font-semibold transition">
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(p.id!)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 bg-white rounded-lg shadow px-4 py-3">
          <span className="text-sm text-gray-500">Página {page} de {totalPages} ({total} productos)</span>
          <div className="flex gap-2">
            <button onClick={() => cargarProductos(1)} disabled={page <= 1}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">⟪ Primera</button>
            <button onClick={() => cargarProductos(page - 1)} disabled={page <= 1}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">← Anterior</button>
            <button onClick={() => cargarProductos(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">Siguiente →</button>
            <button onClick={() => cargarProductos(totalPages)} disabled={page >= totalPages}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">Última ⟫</button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">Sistema de Ventas — GRUPO HACKTHONYPERU S.A.C © 2026</p>
      </div>
    </div>
  );
}