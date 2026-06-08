import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Clientes from '../components/Clientes';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/clienteService';

// Mock del servicio
vi.mock('../services/clienteService', () => ({
  getClientes: vi.fn().mockResolvedValue({
    data: [
      {
        id: 4,
        nombres: 'Carlos',
        apellidos: 'Ramos Torres',
        email: 'carlos.ramos@gmail.com',
        telefono: '976543210',
        direccion: 'Jr. Cusco 456, San Isidro',
        dni: '32109876',
        estado: 'ACTIVO',
        fecha_registro: '2026-05-20T23:04:25.614Z'
      },
      {
        id: 6,
        nombres: 'JESUS',
        apellidos: 'Chavez',
        email: 'a@gmail.com',
        telefono: '963852741',
        direccion: 'las brisas',
        dni: '78451296',
        estado: 'ACTIVO',
        fecha_registro: '2026-05-20T23:35:20.088Z'
      }
    ],
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1
  }),
  createCliente: vi.fn().mockResolvedValue({
    id: 10,
    nombres: 'Ana',
    apellidos: 'Torres',
    email: 'ana@gmail.com',
    telefono: '945123678',
    direccion: 'Lima',
    dni: '71234567',
    estado: 'ACTIVO'
  }),
  updateCliente: vi.fn().mockResolvedValue({}),
  deleteCliente: vi.fn().mockResolvedValue({}),
}));

describe('Componente Clientes - Pruebas Unitarias', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Debe renderizar el título correctamente', async () => {
    render(<Clientes />);
    await waitFor(() => {
      expect(screen.getByText('Gestión de Clientes')).toBeInTheDocument();
    });
  });

  test('Debe mostrar el subtítulo de la empresa', async () => {
    render(<Clientes />);
    await waitFor(() => {
      const elementos = screen.getAllByText(/GRUPO HACKTHONYPERU S\.A\.C/i);
      expect(elementos.length).toBeGreaterThan(0);
    });
  });

  test('Debe mostrar el botón de Nuevo Cliente', async () => {
    render(<Clientes />);
    await waitFor(() => {
      expect(screen.getByText('+ Nuevo Cliente')).toBeInTheDocument();
    });
  });

  test('Debe cargar y mostrar la lista de clientes', async () => {
    render(<Clientes />);
    await waitFor(() => {
      expect(screen.getByText('Carlos')).toBeInTheDocument();
      expect(screen.getByText('JESUS')).toBeInTheDocument();
    });
  });

  test('Debe mostrar el formulario al hacer clic en Nuevo Cliente', async () => {
    render(<Clientes />);
    await waitFor(() => {
      expect(screen.getByText('+ Nuevo Cliente')).toBeInTheDocument();
    });
    const boton = screen.getByText('+ Nuevo Cliente');
    await userEvent.click(boton);
    await waitFor(() => {
      expect(screen.getByText('Nuevo Cliente')).toBeInTheDocument();
    });
  });

  test('Debe mostrar los encabezados de la tabla', async () => {
    render(<Clientes />);
    await waitFor(() => {
      expect(screen.getByText('Nombres')).toBeInTheDocument();
      expect(screen.getByText('Apellidos')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });
  });

  test('Debe mostrar badges ACTIVO para cada cliente', async () => {
    render(<Clientes />);
    await waitFor(() => {
      const badges = screen.getAllByText('ACTIVO');
      expect(badges.length).toBe(2);
    });
  });

  test('Debe mostrar botones de Editar y Eliminar por cliente', async () => {
    render(<Clientes />);
    await waitFor(() => {
      const botonesEditar = screen.getAllByText('Editar');
      const botonesEliminar = screen.getAllByText('Eliminar');
      expect(botonesEditar.length).toBe(2);
      expect(botonesEliminar.length).toBe(2);
    });
  });

  test('Debe permitir escribir en el formulario', async () => {
    const { container } = render(<Clientes />);
    const boton = screen.getByText('+ Nuevo Cliente');
    await userEvent.click(boton);
    const inputNombres = container.querySelector('input[name="nombres"]') as HTMLInputElement;
    expect(inputNombres).toBeInTheDocument();
    await userEvent.type(inputNombres, 'Carlos');
    expect(inputNombres.value).toBe('Carlos');
  });

  test('Debe permitir crear un nuevo cliente con éxito', async () => {
    const { container } = render(<Clientes />);
    const botonNuevo = screen.getByText('+ Nuevo Cliente');
    await userEvent.click(botonNuevo);

    // Escribir en todos los campos obligatorios
    const nombresInput = container.querySelector('input[name="nombres"]') as HTMLInputElement;
    const apellidosInput = container.querySelector('input[name="apellidos"]') as HTMLInputElement;
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const telefonoInput = container.querySelector('input[name="telefono"]') as HTMLInputElement;
    const dniInput = container.querySelector('input[name="dni"]') as HTMLInputElement;
    const direccionInput = container.querySelector('input[name="direccion"]') as HTMLInputElement;

    await userEvent.type(nombresInput, 'Pedro');
    await userEvent.type(apellidosInput, 'Gomez');
    await userEvent.type(emailInput, 'pedro@gomez.com');
    await userEvent.type(telefonoInput, '999888777');
    await userEvent.type(dniInput, '71234567');
    await userEvent.type(direccionInput, 'Lima Cent.');

    const botonGuardar = screen.getByRole('button', { name: 'Guardar' });
    await userEvent.click(botonGuardar);

    await waitFor(() => {
      expect(createCliente).toHaveBeenCalledWith({
        nombres: 'Pedro',
        apellidos: 'Gomez',
        email: 'pedro@gomez.com',
        telefono: '999888777',
        dni: '71234567',
        direccion: 'Lima Cent.'
      });
      expect(screen.getByText('Cliente creado correctamente')).toBeInTheDocument();
    });
  });

  test('Debe permitir editar un cliente existente con éxito', async () => {
    const { container } = render(<Clientes />);

    await waitFor(() => {
      expect(screen.getByText('Carlos')).toBeInTheDocument();
    });

    const botonesEditar = screen.getAllByText('Editar');
    await userEvent.click(botonesEditar[0]); // Hace clic en editar del primer cliente (Carlos)

    // El formulario se debe abrir en modo Editar
    expect(screen.getByText('Editar Cliente')).toBeInTheDocument();
    const nombresInput = container.querySelector('input[name="nombres"]') as HTMLInputElement;

    // Limpiamos y escribimos otro nombre
    await userEvent.clear(nombresInput);
    await userEvent.type(nombresInput, 'Carlos Manuel');

    const botonActualizar = screen.getByRole('button', { name: 'Actualizar' });
    await userEvent.click(botonActualizar);

    await waitFor(() => {
      expect(updateCliente).toHaveBeenCalledWith(4, expect.objectContaining({
        nombres: 'Carlos Manuel',
        estado: 'ACTIVO'
      }));
      expect(screen.getByText('Cliente actualizado correctamente')).toBeInTheDocument();
    });
  });

  test('Debe permitir eliminar un cliente tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Clientes />);

    await waitFor(() => {
      expect(screen.getByText('Carlos')).toBeInTheDocument();
    });

    const botonesEliminar = screen.getAllByText('Eliminar');
    await userEvent.click(botonesEliminar[0]); // Primer cliente (ID 4)

    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de eliminar este cliente?');
    await waitFor(() => {
      expect(deleteCliente).toHaveBeenCalledWith(4);
      expect(screen.getByText('Cliente eliminado correctamente')).toBeInTheDocument();
    });
  });

});