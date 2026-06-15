import { useEffect, useState, useCallback } from 'react';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../services/categoriaService';
import type { Categoria } from '../services/categoriaService';

const categoriaVacia: Categoria = { nombre: '', descripcion: '' };

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState<Categoria>(categoriaVacia);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarCategorias = useCallback(async () => {
    const data = await getCategorias();
    setCategorias(data);
  }, []);

  useEffect(() => { cargarCategorias(); }, [cargarCategorias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await updateCategoria(editandoId, { ...form, estado: 'ACTIVO' });
        setMensaje('Categoría actualizada correctamente');
      } else {
        await createCategoria(form);
        setMensaje('Categoría creada correctamente');
      }
      setForm(categoriaVacia);
      setEditandoId(null);
      setMostrarForm(false);
      cargarCategorias();
      setTimeout(() => setMensaje(''), 3000);
    } catch {
      setError('Error al guardar categoría');
    }
  };

  const handleEditar = (cat: Categoria) => {
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
    setEditandoId(cat.id!);
    setMostrarForm(true);
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        await deleteCategoria(id);
        setMensaje('Categoría eliminada correctamente');
        cargarCategorias();
        setTimeout(() => setMensaje(''), 3000);
      } catch {
        setError('No se puede eliminar, tiene productos asociados');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Gestión de Categorías</h1>
            <p className="text-gray-500 text-sm mt-1">GRUPO HACKTHONYPERU S.A.C</p>
          </div>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); setForm(categoriaVacia); setEditandoId(null); }}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded-lg transition"
          >
            {mostrarForm ? '✕ Cancelar' : '+ Nueva Categoría'}
          </button>
        </div>

        {mensaje && <div role="alert" aria-live="assertive" className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">{mensaje}</div>}
        {error && <div role="alert" aria-live="assertive" className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">{error}</div>}

        {mostrarForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {editandoId ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                <input
                  type="text" name="nombre" value={form.nombre}
                  onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
                <textarea
                  name="descripcion" value={form.descripcion || ''}
                  onChange={handleChange} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex justify-end">
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
                {['ID', 'Nombre', 'Descripción', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorias.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No hay categorías registradas</td></tr>
              ) : (
                categorias.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">{c.id}</td>
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{c.descripcion || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => handleEditar(c)}
                        aria-label={`Editar categoría ${c.nombre}`}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-xs font-semibold transition">
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(c.id!)}
                        aria-label={`Eliminar categoría ${c.nombre}`}
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
        <p className="text-center text-gray-400 text-xs mt-6">Sistema de Ventas — GRUPO HACKTHONYPERU S.A.C © 2026</p>
      </div>
    </div>
  );
}
