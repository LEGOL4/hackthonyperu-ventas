import { API_BASE_URL, getAuthHeaders } from '../config/api';

const API_URL = `${API_BASE_URL}/clientes`;

const fetchConTimeout = async (url: string, options: RequestInit = {}, ms = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

export interface Cliente {
  id?: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  dni: string;
  estado?: string;
  fecha_registro?: string;
}

export interface ClientesPaginados {
  data: Cliente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getClientes = async (page = 1, limit = 20): Promise<ClientesPaginados> => {
  const res = await fetchConTimeout(
    `${API_URL}?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders() }
  );
  return res.json();
};

export const createCliente = async (cliente: Cliente): Promise<Cliente> => {
  const res = await fetchConTimeout(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(cliente),
  });
  return res.json();
};

export const updateCliente = async (id: number, cliente: Cliente): Promise<Cliente> => {
  const res = await fetchConTimeout(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(cliente),
  });
  return res.json();
};

export const deleteCliente = async (id: number): Promise<void> => {
  await fetchConTimeout(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
};