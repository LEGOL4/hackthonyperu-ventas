import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Productos from '../components/Productos';
import { getProductos, createProducto, deleteProducto } from '../services/productoService';
import { getCategorias } from '../services/categoriaService';

vi.mock('../services/productoService', () => ({
  getProductos: vi.fn().mockResolvedValue({
    data: [
      { id: 1, nombre: 'Windows 11', precio: 350.00, stock: 10, stock_minimo: 5, estado: 'ACTIVO', categoria_nombre: 'Software' },
      { id: 2, nombre: 'Consultoría TI', precio: 500.00, stock: 3, stock_minimo: 5, estado: 'ACTIVO', categoria_nombre: 'Consultoría' }
    ],
    total: 2, page: 1, limit: 20, totalPages: 1
  }),
  createProducto: vi.fn().mockResolvedValue({ id: 3, nombre: 'Office 365', estado: 'ACTIVO' }),
  updateProducto: vi.fn().mockResolvedValue({}),
  deleteProducto: vi.fn().mockResolvedValue({}),
}));

vi.mock('../services/categoriaService', () => ({
  getCategorias: vi.fn().mockResolvedValue([
    { id: 1, nombre: 'Software', estado: 'ACTIVO' },
    { id: 2, nombre: 'Consultoría', estado: 'ACTIVO' }
  ]),
}));

describe('Componente Productos - Pruebas Unitarias', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('Debe renderizar el título correctamente', async () => {
    render(<Productos />);
    await waitFor(() => {
      expect(screen.getByText('Gestión de Productos')).toBeInTheDocument();
    });
  });

  test('Debe mostrar el botón de Nuevo Producto', async () => {
    render(<Productos />);
    await waitFor(() => {
      expect(screen.getByText('+ Nuevo Producto')).toBeInTheDocument();
    });
  });

  test('Debe cargar y mostrar la lista de productos', async () => {
    render(<Productos />);
    await waitFor(() => {
      expect(screen.getByText('Windows 11')).toBeInTheDocument();
      expect(screen.getByText('Consultoría TI')).toBeInTheDocument();
    });
  });

  test('Debe mostrar los encabezados de la tabla', async () => {
    render(<Productos />);
    await waitFor(() => {
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Categoría')).toBeInTheDocument();
      expect(screen.getByText('Precio')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
    });
  });

  test('Debe mostrar precios correctamente formateados', async () => {
    render(<Productos />);
    await waitFor(() => {
      expect(screen.getByText('S/. 350.00')).toBeInTheDocument();
      expect(screen.getByText('S/. 500.00')).toBeInTheDocument();
    });
  });

  test('Debe mostrar el formulario al hacer clic en Nuevo Producto', async () => {
    render(<Productos />);
    await waitFor(() => {
      expect(screen.getByText('+ Nuevo Producto')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('+ Nuevo Producto'));
    await waitFor(() => {
      expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
    });
  });

  test('Debe mostrar botones Editar y Eliminar por producto', async () => {
    render(<Productos />);
    await waitFor(() => {
      const botonesEditar = screen.getAllByText('Editar');
      const botonesEliminar = screen.getAllByText('Eliminar');
      expect(botonesEditar.length).toBe(2);
      expect(botonesEliminar.length).toBe(2);
    });
  });

  test('Debe mostrar total de productos registrados', async () => {
    render(<Productos />);
    await waitFor(() => {
      expect(screen.getByText(/2 productos registrados/i)).toBeInTheDocument();
    });
  });

  test('Debe permitir eliminar un producto tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Productos />);

    await waitFor(() => {
      expect(screen.getByText('Windows 11')).toBeInTheDocument();
    });

    const botonesEliminar = screen.getAllByText('Eliminar');
    await userEvent.click(botonesEliminar[0]);

    await waitFor(() => {
      expect(deleteProducto).toHaveBeenCalledWith(1);
      expect(screen.getByText('Producto eliminado correctamente')).toBeInTheDocument();
    });
  });
});