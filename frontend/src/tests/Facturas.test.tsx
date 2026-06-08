import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Facturas from '../components/Facturas';
import { getFacturas, anularFactura } from '../services/facturaService';
import { getPedidos } from '../services/pedidoService';

vi.mock('../services/facturaService', () => ({
  getFacturas: vi.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        numero_serie: 'F001-000001',
        numero_pedido: 'PED-001',
        cliente_nombre: 'Carlos Ramos',
        subtotal: 500.00,
        igv: 90.00,
        total: 590.00,
        estado: 'EMITIDA',
        fecha_emision: '2026-06-01T10:00:00.000Z'
      },
      {
        id: 2,
        numero_serie: 'F001-000002',
        numero_pedido: 'PED-002',
        cliente_nombre: 'Maria Lopez',
        subtotal: 250.00,
        igv: 45.00,
        total: 295.00,
        estado: 'PAGADA',
        fecha_emision: '2026-06-02T10:00:00.000Z'
      }
    ],
    total: 2, page: 1, limit: 20, totalPages: 1
  }),
  getFacturaById: vi.fn().mockResolvedValue({
    id: 1,
    numero_serie: 'F001-000001',
    numero_pedido: 'PED-001',
    cliente_nombre: 'Carlos Ramos',
    cliente_dni: '32109876',
    cliente_email: 'carlos@gmail.com',
    cliente_telefono: '976543210',
    cliente_direccion: 'Jr. Cusco 456',
    subtotal: 500.00,
    igv: 90.00,
    total: 590.00,
    estado: 'EMITIDA',
    fecha_emision: '2026-06-01T10:00:00.000Z',
    detalle: [
      { producto_nombre: 'Windows 11', cantidad: 1, precio_unitario: 350.00, subtotal: 350.00 }
    ]
  }),
  createFactura: vi.fn().mockResolvedValue({ id: 3, numero_serie: 'F001-000003', estado: 'EMITIDA' }),
  anularFactura: vi.fn().mockResolvedValue({ id: 1, estado: 'ANULADA' }),
  getReportes: vi.fn().mockResolvedValue({}),
}));

vi.mock('../services/pedidoService', () => ({
  getPedidos: vi.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        numero_pedido: 'PED-001',
        cliente_nombre: 'Carlos Ramos',
        total: 590.00,
        estado: 'ENTREGADO'
      }
    ],
    total: 1, page: 1, limit: 100, totalPages: 1
  }),
  getPedidoById: vi.fn().mockResolvedValue({}),
  createPedido: vi.fn().mockResolvedValue({}),
  updateEstadoPedido: vi.fn().mockResolvedValue({}),
}));

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    setLineWidth: vi.fn(),
    setFillColor: vi.fn(),
    setTextColor: vi.fn(),
    rect: vi.fn(),
    addImage: vi.fn(),
    save: vi.fn(),
  }))
}));

vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }));

describe('Componente Facturas - Pruebas Unitarias', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('Debe renderizar el título correctamente', async () => {
    render(<Facturas />);
    await waitFor(() => {
      expect(screen.getByText('Gestión de Facturas')).toBeInTheDocument();
    });
  });

  test('Debe mostrar el botón de Emitir Factura', async () => {
    render(<Facturas />);
    await waitFor(() => {
      expect(screen.getByText('+ Emitir Factura')).toBeInTheDocument();
    });
  });

  test('Debe cargar y mostrar la lista de facturas', async () => {
    render(<Facturas />);
    await waitFor(() => {
      expect(screen.getByText('F001-000001')).toBeInTheDocument();
      expect(screen.getByText('F001-000002')).toBeInTheDocument();
    });
  });

  test('Debe mostrar los encabezados de la tabla', async () => {
    render(<Facturas />);
    await waitFor(() => {
      expect(screen.getByText('N° Serie')).toBeInTheDocument();
      expect(screen.getByText('Cliente')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });
  });

  test('Debe mostrar badges de estado correctamente', async () => {
    render(<Facturas />);
    await waitFor(() => {
      expect(screen.getByText('EMITIDA')).toBeInTheDocument();
      expect(screen.getByText('PAGADA')).toBeInTheDocument();
    });
  });

  test('Debe mostrar total de facturas emitidas', async () => {
    render(<Facturas />);
    await waitFor(() => {
      expect(screen.getByText(/2 facturas emitidas/i)).toBeInTheDocument();
    });
  });

  test('Debe mostrar el formulario al hacer clic en Emitir Factura', async () => {
    render(<Facturas />);
    await waitFor(() => {
      expect(screen.getByText('+ Emitir Factura')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('+ Emitir Factura'));
    await waitFor(() => {
      expect(screen.getByText('Emitir Nueva Factura')).toBeInTheDocument();
    });
  });

  test('Debe mostrar botones Ver y Anular por factura', async () => {
    render(<Facturas />);
    await waitFor(() => {
      const botonesVer = screen.getAllByText('Ver');
      expect(botonesVer.length).toBe(2);
    });
  });

  test('Debe anular una factura tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Facturas />);

    await waitFor(() => {
      expect(screen.getByText('F001-000001')).toBeInTheDocument();
    });

    const botonesAnular = screen.getAllByText('Anular');
    await userEvent.click(botonesAnular[0]);

    await waitFor(() => {
      expect(anularFactura).toHaveBeenCalledWith(1);
      expect(screen.getByText('Factura anulada correctamente')).toBeInTheDocument();
    });
  });
});