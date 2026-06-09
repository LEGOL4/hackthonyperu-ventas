import { API_BASE_URL, getAuthHeaders } from '../config/api';

const API_URL = `${API_BASE_URL}/pedidos`;

export interface DetallePedido {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
  producto_nombre?: string;
}

export interface Pedido {
  id?: number;
  cliente_id: number;
  usuario_id?: number;
  numero_pedido?: string;
  estado?: string;
  subtotal?: number;
  igv?: number;
  total?: number;
  observaciones?: string;
  fecha_pedido?: string;
  fecha_entrega?: string;
  cliente_nombre?: string;
  vendedor_nombre?: string;
  detalle?: DetallePedido[];
}

export interface PedidosPaginados {
  data: Pedido[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getPedidos = async (page = 1, limit = 20): Promise<PedidosPaginados> => {
  const res = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders()
  });
  return res.json();
};

export const getPedidoById = async (id: number): Promise<Pedido> => {
  const res = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.json();
};

export const createPedido = async (pedido: Pedido): Promise<Pedido> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(pedido),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.mensaje || 'Error al crear pedido');
  }
  return res.json();
};

export const updateEstadoPedido = async (id: number, estado: string): Promise<Pedido> => {
  const res = await fetch(`${API_URL}/${id}/estado`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.mensaje || 'Error al actualizar estado');
  }
  return res.json();
};