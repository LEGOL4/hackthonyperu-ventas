import { API_BASE_URL, getAuthHeaders } from '../config/api';

const API_URL = `${API_BASE_URL}/categorias`;

export interface Categoria {
  id?: number;
  nombre: string;
  descripcion?: string;
  estado?: string;
}

export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await fetch(API_URL, { headers: getAuthHeaders() });
  return res.json();
};

export const createCategoria = async (categoria: Categoria): Promise<Categoria> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoria),
  });
  return res.json();
};

export const updateCategoria = async (id: number, categoria: Categoria): Promise<Categoria> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoria),
  });
  return res.json();
};

export const deleteCategoria = async (id: number): Promise<void> => {
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
};