import { useEffect, useState, memo, useRef, useCallback, useMemo } from 'react';
import {
  getClientes, createCliente, updateCliente,
  deleteCliente
} from '../services/clienteService';
import type { Cliente } from '../services/clienteService';

const clienteVacio: Cliente = {
  nombres: '', apellidos: '', email: '',
  telefono: '', direccion: '', dni: ''
};

// Formulario memoizado
const FormCliente = memo(({ editandoId, clienteAEditar, onGuardado, onCancelar }: {
  editandoId: number | null;
  clienteAEditar: Cliente | null;
  onGuardado: (msg: string) => void;
  onCancelar: () => void;
}) => {
  const [form, setForm] = useState<Cliente>(clienteVacio);

  useEffect(() => {
    setForm(clienteAEditar ?? clienteVacio);
  }, [editandoId]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await updateCliente(editandoId, { ...form, estado: 'ACTIVO' });
        onGuardado('Cliente actualizado correctamente');
      } else {
        await createCliente(form);
        onGuardado('Cliente creado correctamente');
      }
      setForm(clienteVacio);
    } catch (err: any) {
      onGuardado(err.message || 'Error al guardar cliente');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        {editandoId ? 'Editar Cliente' : 'Nuevo Cliente'}
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {[
          { label: 'Nombres', name: 'nombres' },
          { label: 'Apellidos', name: 'apellidos' },
          { label: 'Email', name: 'email' },
          { label: 'Teléfono', name: 'telefono' },
          { label: 'DNI', name: 'dni' },
          { label: 'Dirección', name: 'direccion' },
        ].map(({ label, name }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            <input
              type="text"
              name={name}
              value={(form as any)[name]}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ))}
        <div className="col-span-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            {editandoId ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
});

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const LIMIT = 20;

  const cargarClientes = useCallback(async (pag = 1) => {
    setCargando(true);
    try {
      const result = await getClientes(pag, LIMIT);
      setClientes(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setClientes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      cargarClientes(1);
    }
  }, [cargarClientes]);

  const clienteAEditar = useMemo(
    () => clientes.find(c => c.id === editandoId) ?? null,
    [editandoId, clientes]
  );

  const handleGuardado = useCallback((msg: string) => {
    setMensaje(msg);
    setMostrarForm(false);
    setEditandoId(null);
    cargarClientes(page);
    setTimeout(() => setMensaje(''), 3000);
  }, [cargarClientes, page]);

  const handleCancelar = useCallback(() => {
    setMostrarForm(false);
    setEditandoId(null);
  }, []);

  const handleNuevoCliente = useCallback(() => {
    setEditandoId(null);
    setMostrarForm(prev => !prev);
  }, []);

  const handleEditar = useCallback((cliente: Cliente) => {
    setEditandoId(cliente.id!);
    setMostrarForm(true);
  }, []);

  const handleEliminar = useCallback(async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await deleteCliente(id);
        setMensaje('Cliente eliminado correctamente');
        cargarClientes(page);
        setTimeout(() => setMensaje(''), 3000);
      } catch (err) {
        console.error('Error al eliminar cliente:', err);
      }
    }
  }, [cargarClientes, page]);

  const irAPagina = useCallback((pag: number) => {
    if (pag >= 1 && pag <= totalPages) {
      cargarClientes(pag);
    }
  }, [cargarClientes, totalPages]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Gestión de Clientes</h1>
            <p className="text-gray-500 text-sm mt-1">
              GRUPO HACKTHONYPERU S.A.C — {total.toLocaleString()} clientes registrados
            </p>
          </div>
          <button
            onClick={handleNuevoCliente}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded-lg transition"
          >
            {mostrarForm ? '✕ Cancelar' : '+ Nuevo Cliente'}
          </button>
        </div>

        {mensaje && (
          <div role="alert" aria-live="assertive" className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">
            {mensaje}
          </div>
        )}

        {mostrarForm && (
          <FormCliente
            editandoId={editandoId}
            clienteAEditar={clienteAEditar}
            onGuardado={handleGuardado}
            onCancelar={handleCancelar}
          />
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                {['ID', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'DNI', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                clientes.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">{c.id}</td>
                    <td className="px-4 py-3 font-medium">{c.nombres}</td>
                    <td className="px-4 py-3">{c.apellidos}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">{c.telefono}</td>
                    <td className="px-4 py-3">{c.dni}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => handleEditar(c)}
                        aria-label={`Editar cliente ${c.nombres} ${c.apellidos}`}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-xs font-semibold transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(c.id!)}
                        aria-label={`Eliminar cliente ${c.nombres} ${c.apellidos}`}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de paginación */}
        <div className="flex justify-between items-center mt-4 bg-white rounded-lg shadow px-4 py-3">
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages.toLocaleString()} ({total.toLocaleString()} clientes)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => irAPagina(1)}
              disabled={page <= 1}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ⟪ Primera
            </button>
            <button
              onClick={() => irAPagina(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Anterior
            </button>
            <button
              onClick={() => irAPagina(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Siguiente →
            </button>
            <button
              onClick={() => irAPagina(totalPages)}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Última ⟫
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Sistema de Ventas — GRUPO HACKTHONYPERU S.A.C © 2026
        </p>
      </div>
    </div>
  );
}
