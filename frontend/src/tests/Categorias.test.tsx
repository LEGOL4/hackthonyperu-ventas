import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Categorias from '../components/Categorias';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../services/categoriaService';

vi.mock('../services/categoriaService', () => ({
  getCategorias: vi.fn().mockResolvedValue([
    { id: 1, nombre: 'Software', descripcion: 'Productos y licencias', estado: 'ACTIVO' },
    { id: 2, nombre: 'Consultoría', descripcion: 'Servicios tecnológicos', estado: 'ACTIVO' }
  ]),
  createCategoria: vi.fn().mockResolvedValue({ id: 3, nombre: 'Hardware', estado: 'ACTIVO' }),
  updateCategoria: vi.fn().mockResolvedValue({}),
  deleteCategoria: vi.fn().mockResolvedValue({}),
}));

describe('Componente Categorias - Pruebas Unitarias', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('Debe renderizar el título correctamente', async () => {
    render(<Categorias />);
    await waitFor(() => {
      expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
    });
  });

  test('Debe mostrar el botón de Nueva Categoría', async () => {
    render(<Categorias />);
    await waitFor(() => {
      expect(screen.getByText('+ Nueva Categoría')).toBeInTheDocument();
    });
  });

  test('Debe cargar y mostrar la lista de categorías', async () => {
    render(<Categorias />);
    await waitFor(() => {
      expect(screen.getByText('Software')).toBeInTheDocument();
      expect(screen.getByText('Consultoría')).toBeInTheDocument();
    });
  });

  test('Debe mostrar los encabezados de la tabla', async () => {
    render(<Categorias />);
    await waitFor(() => {
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Descripción')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });
  });

  test('Debe mostrar badges ACTIVO para cada categoría', async () => {
    render(<Categorias />);
    await waitFor(() => {
      const badges = screen.getAllByText('ACTIVO');
      expect(badges.length).toBe(2);
    });
  });

  test('Debe mostrar el formulario al hacer clic en Nueva Categoría', async () => {
    render(<Categorias />);
    await waitFor(() => {
      expect(screen.getByText('+ Nueva Categoría')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('+ Nueva Categoría'));
    await waitFor(() => {
      expect(screen.getByText('Nueva Categoría')).toBeInTheDocument();
    });
  });

  test('Debe permitir crear una nueva categoría', async () => {
    const { container } = render(<Categorias />);
    await userEvent.click(screen.getByText('+ Nueva Categoría'));

    const nombreInput = container.querySelector('input[name="nombre"]') as HTMLInputElement;
    await userEvent.type(nombreInput, 'Hardware');

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(createCategoria).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Hardware' }));
      expect(screen.getByText('Categoría creada correctamente')).toBeInTheDocument();
    });
  });

  test('Debe mostrar botones Editar y Eliminar por categoría', async () => {
    render(<Categorias />);
    await waitFor(() => {
      const botonesEditar = screen.getAllByText('Editar');
      const botonesEliminar = screen.getAllByText('Eliminar');
      expect(botonesEditar.length).toBe(2);
      expect(botonesEliminar.length).toBe(2);
    });
  });

  test('Debe permitir eliminar una categoría tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Categorias />);

    await waitFor(() => {
      expect(screen.getByText('Software')).toBeInTheDocument();
    });

    const botonesEliminar = screen.getAllByText('Eliminar');
    await userEvent.click(botonesEliminar[0]);

    await waitFor(() => {
      expect(deleteCategoria).toHaveBeenCalledWith(1);
      expect(screen.getByText('Categoría eliminada correctamente')).toBeInTheDocument();
    });
  });
});