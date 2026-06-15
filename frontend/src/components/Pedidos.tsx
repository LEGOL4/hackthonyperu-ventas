import { useEffect, useState, useCallback, useRef } from 'react';
import { getPedidos, createPedido, updateEstadoPedido, getPedidoById } from '../services/pedidoService';
import { getClientes } from '../services/clienteService';
import { getProductos } from '../services/productoService';
import type { Pedido, DetallePedido } from '../services/pedidoService';
import type { Cliente } from '../services/clienteService';
import type { Producto } from '../services/productoService';

const ESTADOS = ['PENDIENTE', 'EN_PROCESO', 'ENTREGADO', 'CANCELADO'];

const colorEstado: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  EN_PROCESO: 'bg-blue-100 text-blue-700',
  ENTREGADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const fetchedRef = useRef(false);

  // Form state
  const [clienteId, setClienteId] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');
  const [detalle, setDetalle] = useState<DetallePedido[]>([]);
  const [productoSelId, setProductoSelId] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);

  const cargarPedidos = useCallback(async (pag = 1) => {
    setCargando(true);
    try {
      const result = await getPedidos(pag, 20);
      setPedidos(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setPage(result.page);
    } catch {
      setPedidos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      cargarPedidos(1);
      getClientes(1, 100).then(r => setClientes(r.data));
      getProductos(1, 100).then(r => setProductos(r.data));
    }
  }, [cargarPedidos]);

  const agregarProducto = () => {
    if (!productoSelId || cantidad <= 0) return;
    const producto = productos.find(p => p.id === productoSelId);
    if (!producto) return;
    const existente = detalle.find(d => d.producto_id === productoSelId);
    if (existente) {
      setDetalle(prev => prev.map(d =>
        d.producto_id === productoSelId
          ? { ...d, cantidad: d.cantidad + cantidad }
          : d
      ));
    } else {
      setDetalle(prev => [...prev, {
        producto_id: producto.id!,
        cantidad,
        precio_unitario: Number(producto.precio),
        producto_nombre: producto.nombre
      }]);
    }
    setProductoSelId(0);
    setCantidad(1);
  };

  const quitarProducto = (producto_id: number) => {
    setDetalle(prev => prev.filter(d => d.producto_id !== producto_id));
  };

  const calcularSubtotal = () => detalle.reduce((acc, d) => acc + d.precio_unitario * d.cantidad, 0);
  const calcularIGV = () => calcularSubtotal() * 0.18;
  const calcularTotal = () => calcularSubtotal() + calcularIGV();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!clienteId || detalle.length === 0) {
      setError('Selecciona un cliente y agrega al menos un producto');
      return;
    }
    try {
      await createPedido({ cliente_id: clienteId, observaciones, detalle });
      setMensaje('Pedido creado correctamente');
      setMostrarForm(false);
      setClienteId(0);
      setObservaciones('');
      setDetalle([]);
      cargarPedidos(page);
      setTimeout(() => setMensaje(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al crear pedido');
    }
  };

  const handleVerDetalle = async (id: number) => {
    const data = await getPedidoById(id);
    setPedidoDetalle(data);
  };

    const handleCambiarEstado = async (id: number, estado: string) => {
    try {
        await updateEstadoPedido(id, estado);
        setMensaje('Estado actualizado correctamente');
        // Actualizar localmente sin recargar
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
        setTimeout(() => setMensaje(''), 3000);
    } catch {
        setError('Error al actualizar estado');
    }
    };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Gestión de Pedidos</h1>
            <p className="text-gray-500 text-sm mt-1">GRUPO HACKTHONYPERU S.A.C — {total} pedidos registrados</p>
          </div>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); setDetalle([]); setClienteId(0); setObservaciones(''); }}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded-lg transition"
          >
            {mostrarForm ? '✕ Cancelar' : '+ Nuevo Pedido'}
          </button>
        </div>

        {mensaje && <div role="alert" aria-live="assertive" className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">{mensaje}</div>}
        {error && <div role="alert" aria-live="assertive" className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Modal detalle */}
        {pedidoDetalle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-800">Pedido {pedidoDetalle.numero_pedido}</h2>
                <button onClick={() => setPedidoDetalle(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="font-medium">Cliente:</span> {pedidoDetalle.cliente_nombre}</div>
                <div><span className="font-medium">Vendedor:</span> {pedidoDetalle.vendedor_nombre}</div>
                <div><span className="font-medium">Estado:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colorEstado[pedidoDetalle.estado || 'PENDIENTE']}`}>
                    {pedidoDetalle.estado}
                  </span>
                </div>
                <div><span className="font-medium">Fecha:</span> {new Date(pedidoDetalle.fecha_pedido!).toLocaleDateString()}</div>
              </div>
              <table className="w-full text-sm mb-4">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    {['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal'].map(h => (
                      <th key={h} className="px-3 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pedidoDetalle.detalle?.map((d, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2">{d.producto_nombre}</td>
                      <td className="px-3 py-2">{d.cantidad}</td>
                      <td className="px-3 py-2">S/. {Number(d.precio_unitario).toFixed(2)}</td>
                      <td className="px-3 py-2">S/. {Number(d.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right text-sm space-y-1">
                <div>Subtotal: <span className="font-semibold">S/. {Number(pedidoDetalle.subtotal).toFixed(2)}</span></div>
                <div>IGV (18%): <span className="font-semibold">S/. {Number(pedidoDetalle.igv).toFixed(2)}</span></div>
                <div className="text-lg font-bold text-blue-800">Total: S/. {Number(pedidoDetalle.total).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario nuevo pedido */}
        {mostrarForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Nuevo Pedido</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cliente</label>
                <select value={clienteId} onChange={e => setClienteId(Number(e.target.value))} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value={0}>Selecciona un cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} — {c.dni}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Agregar Producto</label>
                <div className="flex gap-2">
                  <select value={productoSelId} onChange={e => setProductoSelId(Number(e.target.value))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value={0}>Selecciona un producto</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} — S/. {Number(p.precio).toFixed(2)} (Stock: {p.stock})</option>)}
                  </select>
                  <input type="number" min={1} value={cantidad} onChange={e => setCantidad(Number(e.target.value))}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <button type="button" onClick={agregarProducto}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    Agregar
                  </button>
                </div>
              </div>

              {detalle.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal', ''].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.map((d, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2">{d.producto_nombre}</td>
                          <td className="px-3 py-2">{d.cantidad}</td>
                          <td className="px-3 py-2">S/. {d.precio_unitario.toFixed(2)}</td>
                          <td className="px-3 py-2">S/. {(d.precio_unitario * d.cantidad).toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => quitarProducto(d.producto_id)}
                              className="text-red-500 hover:text-red-700 font-bold">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-3 py-2 bg-gray-50 text-right text-sm space-y-1">
                    <div>Subtotal: <span className="font-semibold">S/. {calcularSubtotal().toFixed(2)}</span></div>
                    <div>IGV (18%): <span className="font-semibold">S/. {calcularIGV().toFixed(2)}</span></div>
                    <div className="text-base font-bold text-blue-800">Total: S/. {calcularTotal().toFixed(2)}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Observaciones</label>
                <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              <div className="flex justify-end">
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition">
                  Crear Pedido
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla pedidos */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                {['N° Pedido', 'Cliente', 'Vendedor', 'Total', 'Estado', 'Fecha', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : pedidos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hay pedidos registrados</td></tr>
              ) : (
                pedidos.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-mono text-xs">{p.numero_pedido}</td>
                    <td className="px-4 py-3">{p.cliente_nombre}</td>
                    <td className="px-4 py-3">{p.vendedor_nombre}</td>
                    <td className="px-4 py-3 font-semibold">S/. {Number(p.total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select value={p.estado}
                        onChange={e => handleCambiarEstado(p.id!, e.target.value)}
                        aria-label={`Cambiar estado del pedido ${p.numero_pedido}`}
                        className={`px-2 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${colorEstado[p.estado || 'PENDIENTE']}`}>
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs">{new Date(p.fecha_pedido!).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleVerDetalle(p.id!)}
                        aria-label={`Ver detalle pedido ${p.numero_pedido}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold transition">
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 bg-white rounded-lg shadow px-4 py-3">
          <span className="text-sm text-gray-500">Página {page} de {totalPages} ({total} pedidos)</span>
          <div className="flex gap-2">
            <button onClick={() => cargarPedidos(1)} disabled={page <= 1}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">⟪ Primera</button>
            <button onClick={() => cargarPedidos(page - 1)} disabled={page <= 1}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">← Anterior</button>
            <button onClick={() => cargarPedidos(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">Siguiente →</button>
            <button onClick={() => cargarPedidos(totalPages)} disabled={page >= totalPages}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">Última ⟫</button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">Sistema de Ventas — GRUPO HACKTHONYPERU S.A.C © 2026</p>
      </div>
    </div>
  );
}
