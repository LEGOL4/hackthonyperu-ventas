const API_URL = 'http://localhost:3000/api/clientes';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

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
    { headers: getHeaders() }
  );
  return res.json();
};

export const createCliente = async (cliente: Cliente): Promise<Cliente> => {
  const res = await fetchConTimeout(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(cliente),
  });
  return res.json();
};

export const updateCliente = async (id: number, cliente: Cliente): Promise<Cliente> => {
  const res = await fetchConTimeout(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(cliente),
  });
  return res.json();
};

export const deleteCliente = async (id: number): Promise<void> => {
  await fetchConTimeout(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};