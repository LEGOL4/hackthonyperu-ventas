const request = require('supertest');
const express = require('express');
const cors = require('cors');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const pool = require('../config/db');
const { generarToken } = require('../config/jwt');
const facturaRoutes = require('../routes/facturas.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/facturas', facturaRoutes);

describe('API Facturas - Pruebas Unitarias con Mocking de BD', () => {
  let tokenValido;

  beforeAll(() => {
    tokenValido = generarToken({
      id: 1, email: 'admin@hack.com', rol: 'ADMIN', nombres: 'Leonardo'
    });
  });

  beforeEach(() => { jest.clearAllMocks(); });

  // ===== GET ALL =====
  describe('GET /api/facturas', () => {
    test('Debe retornar 401 si no se proporciona token', async () => {
      const res = await request(app).get('/api/facturas');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('mensaje', 'Token no proporcionado');
    });

    test('Debe retornar lista de facturas con status 200', async () => {
      const mockFacturas = [
        { id: 1, numero_serie: 'F001-000001', cliente_nombre: 'Carlos Ramos', total: 590.00, estado: 'EMITIDA' },
        { id: 2, numero_serie: 'F001-000002', cliente_nombre: 'Maria Lopez', total: 295.00, estado: 'PAGADA' }
      ];
      pool.query.mockResolvedValueOnce({ rows: [{ count: '2' }] });
      pool.query.mockResolvedValueOnce({ rows: mockFacturas });

      const res = await request(app)
        .get('/api/facturas')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body).toHaveProperty('total', 2);
    });

    test('Debe retornar 500 si la base de datos falla', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/facturas')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('mensaje', 'Error al obtener facturas');
    });
  });

  // ===== GET BY ID =====
  describe('GET /api/facturas/:id', () => {
    test('Debe retornar una factura existente con detalle', async () => {
      const mockFactura = {
        id: 1, numero_serie: 'F001-000001', pedido_id: 1,
        cliente_nombre: 'Carlos Ramos', total: 590.00, estado: 'EMITIDA'
      };
      const mockDetalle = [
        { producto_nombre: 'Windows 11', cantidad: 1, precio_unitario: 350.00, subtotal: 350.00 }
      ];
      pool.query.mockResolvedValueOnce({ rows: [mockFactura] });
      pool.query.mockResolvedValueOnce({ rows: mockDetalle });

      const res = await request(app)
        .get('/api/facturas/1')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('numero_serie', 'F001-000001');
      expect(res.body).toHaveProperty('detalle');
      expect(Array.isArray(res.body.detalle)).toBe(true);
    });

    test('Debe retornar 404 si la factura no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/facturas/9999')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Factura no encontrada');
    });
  });

  // ===== POST =====
  describe('POST /api/facturas', () => {
    test('Debe retornar 400 si no se proporciona pedido_id', async () => {
      const res = await request(app)
        .post('/api/facturas')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'El pedido es requerido');
    });

    test('Debe retornar 404 si el pedido no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/facturas')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ pedido_id: 9999 });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Pedido no encontrado');
    });

    test('Debe retornar 400 si el pedido no está ENTREGADO', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, estado: 'PENDIENTE', cliente_id: 1, subtotal: 500, igv: 90, total: 590 }]
      });

      const res = await request(app)
        .post('/api/facturas')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ pedido_id: 1 });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Solo se pueden facturar pedidos con estado ENTREGADO');
    });

    test('Debe retornar 400 si el pedido ya tiene factura', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, estado: 'ENTREGADO', cliente_id: 1, subtotal: 500, igv: 90, total: 590 }]
      });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const res = await request(app)
        .post('/api/facturas')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ pedido_id: 1 });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Este pedido ya tiene una factura emitida');
    });

    test('Debe crear una factura con status 201', async () => {
      // 1. Pedido existente y ENTREGADO
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, estado: 'ENTREGADO', cliente_id: 2, subtotal: 500, igv: 90, total: 590 }]
      });
      // 2. Factura existente (ninguna)
      pool.query.mockResolvedValueOnce({ rows: [] });
      // 3. COUNT facturas para numero_serie
      pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      // 4. INSERT factura
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, numero_serie: 'F001-000001', estado: 'EMITIDA', total: 590 }]
      });

      const res = await request(app)
        .post('/api/facturas')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ pedido_id: 1 });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('numero_serie', 'F001-000001');
      expect(res.body).toHaveProperty('estado', 'EMITIDA');
    });
  });

  // ===== PUT ANULAR =====
  describe('PUT /api/facturas/:id/anular', () => {
    test('Debe anular una factura con status 200', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, numero_serie: 'F001-000001', estado: 'ANULADA' }]
      });

      const res = await request(app)
        .put('/api/facturas/1/anular')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('estado', 'ANULADA');
    });

    test('Debe retornar 404 si la factura no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/facturas/9999/anular')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Factura no encontrada');
    });
  });

  // ===== GET REPORTES =====
  describe('GET /api/facturas/reportes', () => {
    test('Debe retornar reportes con status 200', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ total_pedidos: 5, ingresos_totales: 2950, igv_total: 450, ticket_promedio: 590 }]
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ estado: 'ENTREGADO', cantidad: 3, total: 1770 }]
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ nombre: 'Windows 11', unidades_vendidas: 5, ingresos: 1750 }]
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ mes: '2026-06', pedidos: 3, total: 1770 }]
      });

      const res = await request(app)
        .get('/api/facturas/reportes')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('resumen');
      expect(res.body).toHaveProperty('por_estado');
      expect(res.body).toHaveProperty('top_productos');
      expect(res.body).toHaveProperty('ventas_por_mes');
    });

    test('Debe retornar 500 si la base de datos falla', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/facturas/reportes')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('mensaje', 'Error al obtener reportes');
    });
  });
});