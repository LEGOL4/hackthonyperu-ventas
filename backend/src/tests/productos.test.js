const request = require('supertest');
const express = require('express');
const cors = require('cors');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const pool = require('../config/db');
const { generarToken } = require('../config/jwt');
const productoRoutes = require('../routes/productos.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/productos', productoRoutes);

describe('API Productos - Pruebas Unitarias con Mocking de BD', () => {
  let tokenValido;

  beforeAll(() => {
    tokenValido = generarToken({
      id: 1, email: 'admin@hack.com', rol: 'ADMIN', nombres: 'Leonardo'
    });
  });

  beforeEach(() => { jest.clearAllMocks(); });

  // ===== GET ALL =====
  describe('GET /api/productos', () => {
    test('Debe retornar 401 si no se proporciona token', async () => {
      const res = await request(app).get('/api/productos');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('mensaje', 'Token no proporcionado');
    });

    test('Debe retornar lista de productos con status 200', async () => {
      const mockProductos = [
        { id: 1, nombre: 'Windows 11', precio: 350.00, stock: 10, categoria_nombre: 'Software' },
        { id: 2, nombre: 'Consultoría TI', precio: 500.00, stock: 5, categoria_nombre: 'Consultoría' }
      ];
      pool.query.mockResolvedValueOnce({ rows: [{ count: '2' }] });
      pool.query.mockResolvedValueOnce({ rows: mockProductos });

      const res = await request(app)
        .get('/api/productos')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].nombre).toBe('Windows 11');
      expect(res.body).toHaveProperty('total', 2);
    });

    test('Debe retornar 500 si la base de datos falla', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/productos')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('mensaje', 'Error al obtener productos');
    });
  });

  // ===== GET BY ID =====
  describe('GET /api/productos/:id', () => {
    test('Debe retornar un producto existente con status 200', async () => {
      const mockProducto = { id: 1, nombre: 'Windows 11', precio: 350.00, stock: 10 };
      pool.query.mockResolvedValueOnce({ rows: [mockProducto] });

      const res = await request(app)
        .get('/api/productos/1')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body.nombre).toBe('Windows 11');
    });

    test('Debe retornar 404 si el producto no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/productos/9999')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Producto no encontrado');
    });
  });

  // ===== POST =====
  describe('POST /api/productos', () => {
    test('Debe crear un nuevo producto con status 201', async () => {
      const nuevoProducto = {
        categoria_id: 1, nombre: 'Office 365',
        precio: 250.00, stock: 20, stock_minimo: 5
      };
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 3, ...nuevoProducto, estado: 'ACTIVO' }]
      });

      const res = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send(nuevoProducto);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 3);
      expect(res.body.nombre).toBe('Office 365');
    });

    test('Debe retornar 400 si faltan campos requeridos', async () => {
      const res = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ nombre: 'Sin categoria ni precio' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Categoría, nombre y precio son requeridos');
    });

    test('Debe retornar 500 si la base de datos falla', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ categoria_id: 1, nombre: 'Test', precio: 100 });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('mensaje', 'Error al crear producto');
    });
  });

  // ===== PUT =====
  describe('PUT /api/productos/:id', () => {
    test('Debe actualizar un producto existente con status 200', async () => {
      const datosActualizados = {
        categoria_id: 1, nombre: 'Windows 11 Pro',
        precio: 400.00, stock: 8, stock_minimo: 3, estado: 'ACTIVO'
      };
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...datosActualizados }] });

      const res = await request(app)
        .put('/api/productos/1')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send(datosActualizados);

      expect(res.statusCode).toBe(200);
      expect(res.body.nombre).toBe('Windows 11 Pro');
      expect(res.body.precio).toBe(400.00);
    });

    test('Debe retornar 404 si el producto no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/productos/9999')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({ categoria_id: 1, nombre: 'No existe', precio: 100, stock: 0, estado: 'ACTIVO' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Producto no encontrado');
    });
  });

  // ===== DELETE =====
  describe('DELETE /api/productos/:id', () => {
    test('Debe eliminar un producto con status 200', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Windows 11' }] });

      const res = await request(app)
        .delete('/api/productos/1')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('mensaje', 'Producto eliminado correctamente');
    });

    test('Debe retornar 404 al eliminar producto inexistente', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/productos/9999')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Producto no encontrado');
    });
  });
});