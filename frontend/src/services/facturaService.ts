const API_URL = 'http://localhost:3000/api/facturas';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export interface Factura {
  id?: number;
  pedido_id: number;
  cliente_id?: number;
  numero_serie?: string;
  subtotal?: number;
  igv?: number;
  total?: number;
  estado?: string;
  fecha_emision?: string;
  numero_pedido?: string;
  cliente_nombre?: string;
  cliente_dni?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  observaciones?: string;
  detalle?: any[];
}

export interface FacturasPaginadas {
  data: Factura[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Reporte {
  resumen: {
    total_pedidos: number;
    ingresos_totales: number;
    igv_total: number;
    ticket_promedio: number;
  };
  por_estado: { estado: string; cantidad: number; total: number }[];
  top_productos: { nombre: string; unidades_vendidas: number; ingresos: number }[];
  ventas_por_mes: { mes: string; pedidos: number; total: number }[];
}

export const getFacturas = async (page = 1, limit = 20): Promise<FacturasPaginadas> => {
  const res = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  return res.json();
};

export const getFacturaById = async (id: number): Promise<Factura> => {
  const res = await fetch(`${API_URL}/${id}`, { headers: getHeaders() });
  return res.json();
};

export const createFactura = async (pedido_id: number): Promise<Factura> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ pedido_id }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.mensaje || 'Error al crear factura');
  }
  return res.json();
};

export const anularFactura = async (id: number): Promise<Factura> => {
  const res = await fetch(`${API_URL}/${id}/anular`, {
    method: 'PUT',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.mensaje || 'Error al anular factura');
  }
  return res.json();
};

export const getReportes = async (): Promise<Reporte> => {
  const res = await fetch(`${API_URL}/reportes`, { headers: getHeaders() });
  return res.json();
};