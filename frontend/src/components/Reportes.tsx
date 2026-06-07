import { useEffect, useState, useRef } from 'react';
import { getReportes } from '../services/facturaService';
import type { Reporte } from '../services/facturaService';

export default function Reportes() {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      getReportes().then(data => {
        setReporte(data);
        setCargando(false);
      });
    }
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Cargando reportes...</p>
      </div>
    );
  }

  if (!reporte) return null;

  const { resumen, por_estado, top_productos, ventas_por_mes } = reporte;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-800">Reportes y Estadísticas</h1>
          <p className="text-gray-500 text-sm mt-1">GRUPO HACKTHONYPERU S.A.C</p>
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Pedidos', value: resumen.total_pedidos, prefix: '', suffix: '' },
            { label: 'Ingresos Totales', value: Number(resumen.ingresos_totales || 0).toFixed(2), prefix: 'S/. ', suffix: '' },
            { label: 'IGV Total', value: Number(resumen.igv_total || 0).toFixed(2), prefix: 'S/. ', suffix: '' },
            { label: 'Ticket Promedio', value: Number(resumen.ticket_promedio || 0).toFixed(2), prefix: 'S/. ', suffix: '' },
          ].map(({ label, value, prefix }) => (
            <div key={label} className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-blue-800">{prefix}{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Pedidos por estado */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Pedidos por Estado</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Estado</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Cantidad</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {por_estado.map((e, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2">{e.estado}</td>
                    <td className="py-2 text-right font-semibold">{e.cantidad}</td>
                    <td className="py-2 text-right">S/. {Number(e.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ventas por mes */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Ventas por Mes</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Mes</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Pedidos</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas_por_mes.length === 0 ? (
                  <tr><td colSpan={3} className="py-4 text-center text-gray-400">Sin datos</td></tr>
                ) : ventas_por_mes.map((m, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2">{m.mes}</td>
                    <td className="py-2 text-right font-semibold">{m.pedidos}</td>
                    <td className="py-2 text-right">S/. {Number(m.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Top 5 Productos Más Vendidos</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">#</th>
                <th className="text-left py-2 text-gray-500 font-medium">Producto</th>
                <th className="text-right py-2 text-gray-500 font-medium">Unidades Vendidas</th>
                <th className="text-right py-2 text-gray-500 font-medium">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {top_productos.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-gray-400">Sin datos</td></tr>
              ) : top_productos.map((p, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 font-bold text-blue-700">#{i + 1}</td>
                  <td className="py-2 font-medium">{p.nombre}</td>
                  <td className="py-2 text-right">{p.unidades_vendidas}</td>
                  <td className="py-2 text-right font-semibold">S/. {Number(p.ingresos || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">Sistema de Ventas — GRUPO HACKTHONYPERU S.A.C © 2026</p>
      </div>
    </div>
  );
}