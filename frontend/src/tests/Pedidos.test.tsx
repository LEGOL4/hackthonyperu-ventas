import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Pedidos from '../components/Pedidos';
import { getPedidos, updateEstadoPedido } from '../services/pedidoService';
import { getClientes } from '../services/clienteService';
import { getProductos } from '../services/productoService';

vi.mock('../services/pedidoService', () => ({
  getPedidos: vi.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        numero_pedido: 'PED-001',
        cliente_nombre: 'Carlos Ramos',
        vendedor_nombre: 'Rodrigo Aniceto',
        total: 590.00,
        estado: 'PENDIENTE',
        fecha_pedido: '2026-06-01T10:00:00.000Z'
      },
      {
        id: 2,
        numero_pedido: 'PED-002',
        cliente_nombre: 'Maria Lopez',
        vendedor_nombre: 'Rodrigo Aniceto',
        total: 295.00,
        estado: 'ENTREGADO',
        fecha_pedido: '2026-06-02T10:00:00.000Z'
      }
    ],
    total: 2, page: 1, limit: 20, totalPages: 1
  }),
  getPedidoById: vi.fn().mockResolvedValue({
    id: 1,
    numero_pedido: 'PED-001',
    cliente_nombre: 'Carlos Ramos',
    vendedor_nombre: 'Rodrigo Aniceto',
    total: 590.00,
    subtotal: 500.00,
    igv: 90.00,
    estado: 'PENDIENTE',
    fecha_pedido: '2026-06-01T10:00:00.000Z',
    detalle: [
      { producto_nombre: 'Windows 11', cantidad: 1, precio_unitario: 350.00, subtotal: 350.00 }
    ]
  }),
  createPedido: vi.fn().mockResolvedValue({ id: 3, numero_pedido: 'PED-003' }),
  updateEstadoPedido: vi.fn().mockResolvedValue({ id: 1, estado: 'EN_PROCESO' }),
}));

vi.mock('../services/clienteService', () => ({
  getClientes: vi.fn().mockResolvedValue({
    data: [
      { id: 1, nombres: 'Carlos', apellidos: 'Ramos', dni: '32109876', estado: 'ACTIVO' }
    ],
    total: 1, page: 1, limit: 100, totalPages: 1
  }),
}));

vi.mock('../services/productoService', () => ({
  getProductos: vi.fn().mockResolvedValue({
    data: [
      { id: 1, nombre: 'Windows 11', precio: 350.00, stock: 10, estado: 'ACTIVO' }
    ],
    total: 1, page: 1, limit: 100, totalPages: 1
  }),
}));

describe('Componente Pedidos - Pruebas Unitarias', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('Debe renderizar el título correctamente', async () => {
    render(<Pedidos />);
    await waitFor(() => {
      expect(screen.getByText('Gestión de Pedidos')).toBeInTheDocument();
    });
  });

  test('Debe mostrar el botón de Nuevo Pedido', async () => {
    render(<Pedidos />);
    await waitFor(() => {
      expect(screen.getByText('+ Nuevo Pedido')).toBeInTheDocument();
    });
  });

  test('Debe cargar y mostrar la lista de pedidos', async () => {
    render(<Pedidos />);
    await waitFor(() => {
      expect(screen.getByText('PED-001')).toBeInTheDocument();
      expect(screen.getByText('PED-002')).toBeInTheDocument();
    });
  });

  test('Debe mostrar los encabezados de la tabla', async () => {
    render(<Pedidos />);
    await waitFor(() => {
      expect(screen.getByText('N° Pedido')).toBeInTheDocument();
      expect(screen.getByText('Cliente')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });
  });

  test('Debe mostrar nombres de clientes en la tabla', async () => {
    render(<Pedidos />);
    await waitFor(() => {
      expect(screen.getByText('Carlos Ramos')).toBeInTheDocument();
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
    });
  });

  test('Debe mostrar totales formateados correctamente', async () => {
    render(<Pedidos />);
    await waitFor(() => {
      expect(screen.getByText('S/. 590.00')).toBeInTheDocument();
      expect(screen.getByText('S/. 295.00')).toBeInTheDocument();
    });
  });

  test('Debe mostrar el formulario al hacer clic en Nuevo Pedido', async () => {
    render(<Pedidos />);
    await waitFor(() => {
      expect(screen.getByText('+ Nuevo Pedido')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('+ Nuevo Pedido'));
    await waitFor(() => {
      expect(screen.getByText('Nuevo Pedido')).toBeInTheDocument();
    });
  });

  test('Debe mostrar botones Ver Detalle por pedido', async () => {
    render(<Pedidos />);
    await waitFor(() => {
      const botones = screen.getAllByText('Ver Detalle');
      expect(botones.length).toBe(2);
    });
  });

  test('Debe mostrar total de pedidos registrados', async () => {
    render(<Pedidos />);
    await waitFor(() => {
      expect(screen.getByText(/2 pedidos registrados/i)).toBeInTheDocument();
    });
  });
});