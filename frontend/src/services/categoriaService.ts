const API_URL = 'http://localhost:3000/api/categorias';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export interface Categoria {
  id?: number;
  nombre: string;
  descripcion?: string;
  estado?: string;
}

export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await fetch(API_URL, { headers: getHeaders() });
  return res.json();
};

export const createCategoria = async (categoria: Categoria): Promise<Categoria> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(categoria),
  });
  return res.json();
};

export const updateCategoria = async (id: number, categoria: Categoria): Promise<Categoria> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(categoria),
  });
  return res.json();
};

export const deleteCategoria = async (id: number): Promise<void> => {
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};