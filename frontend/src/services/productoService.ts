const API_URL = 'http://localhost:3000/api/productos';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export interface Producto {
  id?: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stock_minimo?: number;
  imagen_url?: string;
  estado?: string;
  fecha_registro?: string;
  categoria_nombre?: string;
}

export interface ProductosPaginados {
  data: Producto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getProductos = async (page = 1, limit = 20): Promise<ProductosPaginados> => {
  const res = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  return res.json();
};

export const createProducto = async (producto: Producto): Promise<Producto> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(producto),
  });
  return res.json();
};

export const updateProducto = async (id: number, producto: Producto): Promise<Producto> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(producto),
  });
  return res.json();
};

export const deleteProducto = async (id: number): Promise<void> => {
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};