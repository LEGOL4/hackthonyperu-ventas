const request = require('supertest');
const express = require('express');
const cors = require('cors');

jest.mock('../config/db', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient),
    mockClient
  };
});

const pool = require('../config/db');
const { generarToken } = require('../config/jwt');
const pedidoRoutes = require('../routes/pedidos.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/pedidos', pedidoRoutes);

describe('API Pedidos - Pruebas Unitarias con Mocking de BD', () => {
  let tokenValido;

  beforeAll(() => {
    tokenValido = generarToken({
      id: 1, email: 'admin@hack.com', rol: 'ADMIN', nombres: 'Leonardo'
    });
  });

  beforeEach(() => { jest.clearAllMocks(); });

  // ===== GET ALL =====
  describe('GET /api/pedidos', () => {
    test('Debe retornar 401 si no se proporciona token', async () => {
      const res = await request(app).get('/api/pedidos');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('mensaje', 'Token no proporcionado');
    });

    test('Debe retornar lista de pedidos con status 200', async () => {
      const mockPedidos = [
        { id: 1, numero_pedido: 'PED-001', cliente_nombre: 'Carlos Ramos', total: 590.00, estado: 'PENDIENTE' },
        { id: 2, numero_pedido: 'PED-002', cliente_nombre: 'Maria Lopez', total: 295.00, estado: 'ENTREGADO' }
      ];
      pool.query.mockResolvedValueOnce({ rows: [{ count: '2' }] });
      pool.query.mockResolvedValueOnce({ rows: mockPedidos });

      const res = await request(app)
        .get('/api/pedidos')
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
        .get('/api/pedidos')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('mensaje', 'Error al obtener pedidos');
    });
  });

  // ===== GET BY ID =====
  describe('GET /api/pedidos/:id', () => {
    test('Debe retornar un pedido existente con detalle', async () => {
      const mockPedido = { id: 1, numero_pedido: 'PED-001', total: 590.00, estado: 'PENDIENTE' };
      const mockDetalle = [{ producto_id: 1, cantidad: 2, precio_unitario: 250.00, subtotal: 500.00 }];
      pool.query.mockResolvedValueOnce({ rows: [mockPedido] });
      pool.query.mockResolvedValueOnce({ rows: mockDetalle });

      const res = await request(app)
        .get('/api/pedidos/1')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('numero_pedido', 'PED-001');
      expect(res.body).toHaveProperty('detalle');
      expect(Array.isArray(res.body.detalle)).toBe(true);
    });

    test('Debe retornar 404 si el pedido no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/pedidos/9999')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Pedido no encontrado');
    });
  });

  // ===== PUT ESTADO =====
  describe('PUT /api/pedidos/:id/estado', () => {
    test('Debe actualizar el estado del pedido con status 200', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, numero_pedido: 'PED-001', estado: 'EN_PROCESO' }]
      });

      const res = await request(app)
        .put('/api/pedidos/1/estado')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ estado: 'EN_PROCESO' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('estado', 'EN_PROCESO');
    });

    test('Debe retornar 400 si el estado no es válido', async () => {
      const res = await request(app)
        .put('/api/pedidos/1/estado')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ estado: 'INVALIDO' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Estado no válido');
    });

    test('Debe retornar 404 si el pedido no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/pedidos/9999/estado')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ estado: 'ENTREGADO' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Pedido no encontrado');
    });
  });
});