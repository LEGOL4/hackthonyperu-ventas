import { useEffect, useState, useCallback, useRef } from 'react';
import { getFacturas, getFacturaById, createFactura, anularFactura } from '../services/facturaService';
import { getPedidos } from '../services/pedidoService';
import type { Factura } from '../services/facturaService';
import type { Pedido } from '../services/pedidoService';
import jsPDF from 'jspdf';
import logoHackthony from '../assets/logo.png';

const colorEstado: Record<string, string> = {
  EMITIDA: 'bg-blue-100 text-blue-700',
  PAGADA: 'bg-green-100 text-green-700',
  ANULADA: 'bg-red-100 text-red-700',
};

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pedidosEntregados, setPedidosEntregados] = useState<Pedido[]>([]);
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [pedidoSelId, setPedidoSelId] = useState<number>(0);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const fetchedRef = useRef(false);

  const cargarFacturas = useCallback(async (pag = 1) => {
    setCargando(true);
    try {
      const result = await getFacturas(pag, 20);
      setFacturas(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setPage(result.page);
    } catch {
      setFacturas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      cargarFacturas(1);
      getPedidos(1, 100).then(r => {
        setPedidosEntregados(r.data.filter(p => p.estado === 'ENTREGADO'));
      });
    }
  }, [cargarFacturas]);

  const handleCrearFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pedidoSelId) {
      setError('Selecciona un pedido');
      return;
    }
    try {
      await createFactura(pedidoSelId);
      setMensaje('Factura emitida correctamente');
      setMostrarForm(false);
      setPedidoSelId(0);
      cargarFacturas(page);
      setTimeout(() => setMensaje(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al emitir factura');
    }
  };

  const handleAnular = async (id: number) => {
    if (window.confirm('¿Estás seguro de anular esta factura?')) {
      try {
        await anularFactura(id);
        setMensaje('Factura anulada correctamente');
        cargarFacturas(page);
        setTimeout(() => setMensaje(''), 3000);
      } catch (err: any) {
        setError(err.message || 'Error al anular factura');
      }
    }
  };

  const handleVerDetalle = async (id: number) => {
    const data = await getFacturaById(id);
    setFacturaDetalle(data);
  };

  const generarPDF = (factura: Factura) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Logo empresa
    const img = new Image();
    img.src = logoHackthony;
    doc.addImage(img, 'PNG', 150, 10, 40, 20);

  const margen = 20;
  let y = 20;

  // Encabezado empresa
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GRUPO HACKTHONYPERU S.A.C', margen, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RUC: 20549957332', margen, y); y += 5;
  doc.text('Las Lajas Nro. 721 Urb. Inca Manco Capac', margen, y); y += 5;
  doc.text('Tel: +51 994520017', margen, y); y += 5;
  doc.text('consultas@hackthonyperu.com', margen, y); y += 10;

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margen, y, 190, y); y += 8;

  // Datos factura
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`FACTURA ELECTRÓNICA`, margen, y); y += 7;
  doc.setFontSize(11);
  doc.text(`N°: ${factura.numero_serie}`, margen, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Pedido: ${factura.numero_pedido}`, margen, y); y += 5;
  doc.text(`Fecha: ${new Date(factura.fecha_emision!).toLocaleDateString('es-PE')}`, margen, y); y += 5;
  doc.text(`Estado: ${factura.estado}`, margen, y); y += 10;

  // Datos cliente
  doc.line(margen, y, 190, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', margen, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${factura.cliente_nombre}`, margen, y); y += 5;
  doc.text(`DNI: ${factura.cliente_dni}`, margen, y); y += 5;
  doc.text(`Email: ${factura.cliente_email || '—'}`, margen, y); y += 5;
  doc.text(`Teléfono: ${factura.cliente_telefono || '—'}`, margen, y); y += 5;
  doc.text(`Dirección: ${factura.cliente_direccion || '—'}`, margen, y); y += 10;

  // Tabla detalle
  doc.line(margen, y, 190, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE', margen, y); y += 6;

  // Encabezados tabla
  doc.setFillColor(30, 58, 138);
  doc.rect(margen, y, 170, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('Producto', margen + 2, y + 5);
  doc.text('Cant.', 120, y + 5);
  doc.text('P. Unit.', 140, y + 5);
  doc.text('Subtotal', 165, y + 5);
  y += 9;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  factura.detalle?.forEach((d: any, i: number) => {
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margen, y - 3, 170, 7, 'F');
    }
    doc.text(String(d.producto_nombre).substring(0, 35), margen + 2, y + 2);
    doc.text(String(d.cantidad), 122, y + 2);
    doc.text(`S/. ${Number(d.precio_unitario).toFixed(2)}`, 138, y + 2);
    doc.text(`S/. ${Number(d.subtotal).toFixed(2)}`, 163, y + 2);
    y += 7;
  });

  y += 5;
  doc.line(margen, y, 190, y); y += 6;

  // Totales
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal:`, 140, y);
  doc.text(`S/. ${Number(factura.subtotal).toFixed(2)}`, 170, y); y += 6;
  doc.text(`IGV (18%):`, 140, y);
  doc.text(`S/. ${Number(factura.igv).toFixed(2)}`, 170, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TOTAL:`, 140, y);
  doc.text(`S/. ${Number(factura.total).toFixed(2)}`, 170, y); y += 12;

  // Pie de página
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Gracias por su preferencia — GRUPO HACKTHONYPERU S.A.C © 2026', margen, y);

  doc.save(`Factura_${factura.numero_serie}.pdf`);
};
const generarTicket = (factura: Factura) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] });

    let y = 5;
    const margen = 5;
    const ancho = 70;

    // Logo
    const img = new Image();
    img.src = logoHackthony;
    doc.addImage(img, 'PNG', 20, y, 30, 15);
    y += 18;

    // Encabezado empresa
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('GRUPO HACKTHONYPERU S.A.C', ancho / 2, y, { align: 'center' }); y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('RUC: 20549957332', ancho / 2, y, { align: 'center' }); y += 4;
    doc.text('Las Lajas Nro. 721 Urb. Inca Manco Capac', ancho / 2, y, { align: 'center' }); y += 4;
    doc.text('Tel: +51 994520017', ancho / 2, y, { align: 'center' }); y += 4;
    doc.text('consultas@hackthonyperu.com', ancho / 2, y, { align: 'center' }); y += 5;

    // Línea
    doc.setLineWidth(0.3);
    doc.line(margen, y, ancho, y); y += 4;

    // Datos factura
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('FACTURA ELECTRÓNICA', ancho / 2, y, { align: 'center' }); y += 5;
    doc.setFontSize(7);
    doc.text(`N°: ${factura.numero_serie}`, ancho / 2, y, { align: 'center' }); y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`Pedido: ${factura.numero_pedido}`, margen, y); y += 4;
    doc.text(`Fecha: ${new Date(factura.fecha_emision!).toLocaleDateString('es-PE')}`, margen, y); y += 4;
    doc.text(`Estado: ${factura.estado}`, margen, y); y += 5;

    // Línea
    doc.line(margen, y, ancho, y); y += 4;

    // Datos cliente
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', margen, y); y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`${factura.cliente_nombre}`, margen, y); y += 4;
    doc.text(`DNI: ${factura.cliente_dni}`, margen, y); y += 4;
    if (factura.cliente_telefono) {
      doc.text(`Tel: ${factura.cliente_telefono}`, margen, y); y += 4;
    }

    // Línea
    y += 1;
    doc.line(margen, y, ancho, y); y += 4;

    // Encabezado productos
    doc.setFont('helvetica', 'bold');
    doc.text('Producto', margen, y);
    doc.text('Cant', 45, y);
    doc.text('P.U.', 55, y);
    doc.text('Sub.', 65, y);
    y += 3;
    doc.line(margen, y, ancho, y); y += 3;

    // Detalle productos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    factura.detalle?.forEach((d: any) => {
      const nombre = String(d.producto_nombre).substring(0, 20);
      doc.text(nombre, margen, y);
      doc.text(String(d.cantidad), 45, y);
      doc.text(`${Number(d.precio_unitario).toFixed(2)}`, 53, y);
      doc.text(`${Number(d.subtotal).toFixed(2)}`, 63, y);
      y += 5;
    });

    // Línea
    doc.line(margen, y, ancho, y); y += 4;

    // Totales
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 40, y);
    doc.text(`S/. ${Number(factura.subtotal).toFixed(2)}`, 58, y); y += 4;
    doc.text('IGV (18%):', 40, y);
    doc.text(`S/. ${Number(factura.igv).toFixed(2)}`, 58, y); y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL:', 40, y);
    doc.text(`S/. ${Number(factura.total).toFixed(2)}`, 58, y); y += 6;

    // Línea
    doc.setLineWidth(0.3);
    doc.line(margen, y, ancho, y); y += 4;

    // Pie
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text('¡Gracias por su preferencia!', ancho / 2, y, { align: 'center' }); y += 4;
    doc.text('GRUPO HACKTHONYPERU S.A.C © 2026', ancho / 2, y, { align: 'center' });

    doc.save(`Ticket_${factura.numero_serie}.pdf`);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Gestión de Facturas</h1>
            <p className="text-gray-500 text-sm mt-1">GRUPO HACKTHONYPERU S.A.C — {total} facturas emitidas</p>
          </div>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); setPedidoSelId(0); setError(''); }}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded-lg transition"
          >
            {mostrarForm ? '✕ Cancelar' : '+ Emitir Factura'}
          </button>
        </div>

        {mensaje && <div role="alert" aria-live="assertive" className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">{mensaje}</div>}
        {error && <div role="alert" aria-live="assertive" className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Modal detalle factura */}
        {facturaDetalle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-blue-800">Factura {facturaDetalle.numero_serie}</h2>
                  <p className="text-sm text-gray-500">Pedido: {facturaDetalle.numero_pedido}</p>
                </div>
                <div className="flex justify-between items-center mt-4 bg-white rounded-lg shadow px-4 py-3">
          <span className="text-sm text-gray-500">Página {page} de {totalPages} ({total} facturas)</span>
                <div className="flex gap-2">
                        <button
                            onClick={() => generarPDF(facturaDetalle)}
                            aria-label={`Descargar PDF de factura ${facturaDetalle.numero_serie}`}
                            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition"
                        >
                            📄 PDF
                        </button>
                        <button
                            onClick={() => generarTicket(facturaDetalle)}
                            aria-label={`Descargar ticket de factura ${facturaDetalle.numero_serie}`}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition"
                        >
                            🧾 Ticket
                        </button>
                        <button onClick={() => setFacturaDetalle(null)}
                            aria-label="Cerrar detalle de factura"
                            className="text-gray-400 hover:text-gray-600 text-2xl font-bold">✕
                        </button>
                    </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4 bg-gray-50 p-3 rounded-lg">
                <div><span className="font-medium">Cliente:</span> {facturaDetalle.cliente_nombre}</div>
                <div><span className="font-medium">DNI:</span> {facturaDetalle.cliente_dni}</div>
                <div><span className="font-medium">Email:</span> {facturaDetalle.cliente_email}</div>
                <div><span className="font-medium">Teléfono:</span> {facturaDetalle.cliente_telefono}</div>
                <div className="col-span-2"><span className="font-medium">Dirección:</span> {facturaDetalle.cliente_direccion}</div>
                <div><span className="font-medium">Fecha:</span> {new Date(facturaDetalle.fecha_emision!).toLocaleDateString()}</div>
                <div><span className="font-medium">Estado:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colorEstado[facturaDetalle.estado || 'EMITIDA']}`}>
                    {facturaDetalle.estado}
                  </span>
                </div>
              </div>
              <table className="w-full text-sm mb-4">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    {['Producto', 'Cant.', 'Precio Unit.', 'Subtotal'].map(h => (
                      <th key={h} className="px-3 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {facturaDetalle.detalle?.map((d: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2">{d.producto_nombre}</td>
                      <td className="px-3 py-2">{d.cantidad}</td>
                      <td className="px-3 py-2">S/. {Number(d.precio_unitario).toFixed(2)}</td>
                      <td className="px-3 py-2">S/. {Number(d.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right text-sm space-y-1 border-t pt-3">
                <div>Subtotal: <span className="font-semibold">S/. {Number(facturaDetalle.subtotal).toFixed(2)}</span></div>
                <div>IGV (18%): <span className="font-semibold">S/. {Number(facturaDetalle.igv).toFixed(2)}</span></div>
                <div className="text-lg font-bold text-blue-800">Total: S/. {Number(facturaDetalle.total).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario emitir factura */}
        {mostrarForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Emitir Nueva Factura</h2>
            <form onSubmit={handleCrearFactura} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Pedido Entregado
                </label>
                <select value={pedidoSelId} onChange={e => setPedidoSelId(Number(e.target.value))} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value={0}>Selecciona un pedido entregado</option>
                  {pedidosEntregados.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.numero_pedido} — {p.cliente_nombre} — S/. {Number(p.total).toFixed(2)}
                    </option>
                  ))}
                </select>
                {pedidosEntregados.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">No hay pedidos con estado ENTREGADO disponibles</p>
                )}
              </div>
              <div className="flex justify-end">
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition">
                  Emitir Factura
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla facturas */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                {['N° Serie', 'Pedido', 'Cliente', 'Subtotal', 'IGV', 'Total', 'Estado', 'Fecha', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : facturas.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No hay facturas emitidas</td></tr>
              ) : (
                facturas.map((f, i) => (
                  <tr key={f.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-mono text-xs">{f.numero_serie}</td>
                    <td className="px-4 py-3 font-mono text-xs">{f.numero_pedido}</td>
                    <td className="px-4 py-3">{f.cliente_nombre}</td>
                    <td className="px-4 py-3">S/. {Number(f.subtotal).toFixed(2)}</td>
                    <td className="px-4 py-3">S/. {Number(f.igv).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold">S/. {Number(f.total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorEstado[f.estado || 'EMITIDA']}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{new Date(f.fecha_emision!).toLocaleDateString()}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => handleVerDetalle(f.id!)}
                        aria-label={`Ver detalle factura ${f.numero_serie}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold transition">
                        Ver
                      </button>
                      {f.estado !== 'ANULADA' && (
                        <button onClick={() => handleAnular(f.id!)}
                          aria-label={`Anular factura ${f.numero_serie}`}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition">
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 bg-white rounded-lg shadow px-4 py-3">
          <span className="text-sm text-gray-500">Página {page} de {totalPages} ({total} facturas)</span>
          <div className="flex gap-2">
            <button onClick={() => cargarFacturas(1)} disabled={page <= 1}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">⟪ Primera</button>
            <button onClick={() => cargarFacturas(page - 1)} disabled={page <= 1}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">← Anterior</button>
            <button onClick={() => cargarFacturas(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">Siguiente →</button>
            <button onClick={() => cargarFacturas(totalPages)} disabled={page >= totalPages}
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:opacity-40 transition">Última ⟫</button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">Sistema de Ventas — GRUPO HACKTHONYPERU S.A.C © 2026</p>
      </div>
    </div>
  );
}
