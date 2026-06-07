const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Mockear el pool de la base de datos antes de importar las rutas/controladores
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const pool = require('../config/db');
const { generarToken } = require('../config/jwt');
const clienteRoutes = require('../routes/clientes.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/clientes', clienteRoutes);

describe('API Clientes - Pruebas Unitarias con Mocking de BD', () => {
  let tokenValido;

  beforeAll(() => {
    // Generar un token válido para pasar el middleware verificarAuth
    tokenValido = generarToken({
      id: 1,
      email: 'admin@hack.com',
      rol: 'ADMIN',
      nombres: 'Leonardo'
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== GET ALL =====
  describe('GET /api/clientes', () => {
    test('Debe retornar 401 si no se proporciona el token', async () => {
      const res = await request(app).get('/api/clientes');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('mensaje', 'Token no proporcionado');
    });

    test('Debe retornar lista de clientes con status 200', async () => {
      const mockClientes = [
        { id: 4, nombres: 'Carlos', apellidos: 'Ramos', email: 'carlos@gmail.com', estado: 'ACTIVO' },
        { id: 6, nombres: 'JESUS', apellidos: 'Chavez', email: 'jesus@gmail.com', estado: 'ACTIVO' }
      ];
      pool.query.mockResolvedValueOnce({ rows: mockClientes });

      const res = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].nombres).toBe('Carlos');
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM clientes ORDER BY fecha_registro DESC'
      );
    });

    test('Debe retornar 500 si la base de datos falla', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('mensaje', 'Error al obtener clientes');
    });
  });

  // ===== GET BY ID =====
  describe('GET /api/clientes/:id', () => {
    test('Debe retornar un cliente existente con status 200', async () => {
      const mockCliente = { id: 4, nombres: 'Carlos', email: 'carlos@gmail.com' };
      pool.query.mockResolvedValueOnce({ rows: [mockCliente] });

      const res = await request(app)
        .get('/api/clientes/4')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 4);
      expect(res.body.nombres).toBe('Carlos');
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM clientes WHERE id = $1', ['4']
      );
    });

    test('Debe retornar 404 si el cliente no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/clientes/9999')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Cliente no encontrado');
    });
  });

  // ===== POST =====
  describe('POST /api/clientes', () => {
    test('Debe crear un nuevo cliente con status 201', async () => {
      const nuevoCliente = {
        nombres: 'Pedro',
        apellidos: 'Gutierrez',
        email: 'pedro@gmail.com',
        telefono: '912345678',
        direccion: 'Av. Test 123',
        dni: '77889900'
      };
      
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 10, ...nuevoCliente, estado: 'ACTIVO' }]
      });

      const res = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send(nuevoCliente);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 10);
      expect(res.body.nombres).toBe('Pedro');
      expect(res.body.estado).toBe('ACTIVO');
    });

    test('Debe retornar 400 si el DNI ya está registrado (Error 23505)', async () => {
      const nuevoCliente = {
        nombres: 'Pedro',
        apellidos: 'Gutierrez',
        email: 'pedro@gmail.com',
        telefono: '912345678',
        direccion: 'Av. Test 123',
        dni: '77889900'
      };

      const errorDb = new Error('Unique constraint violation');
      errorDb.code = '23505';
      errorDb.constraint = 'clientes_dni_key';
      pool.query.mockRejectedValueOnce(errorDb);

      const res = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send(nuevoCliente);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'El DNI ya está registrado');
    });
  });

  // ===== PUT =====
  describe('PUT /api/clientes/:id', () => {
    test('Debe actualizar un cliente existente con status 200', async () => {
      const datosActualizados = {
        nombres: 'Carlos Alberto',
        apellidos: 'Ramos Torres',
        email: 'carlos.ramos@gmail.com',
        telefono: '976543210',
        direccion: 'Jr. Cusco 456',
        dni: '32109876',
        estado: 'ACTIVO'
      };

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 4, ...datosActualizados }]
      });

      const res = await request(app)
        .put('/api/clientes/4')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send(datosActualizados);

      expect(res.statusCode).toBe(200);
      expect(res.body.nombres).toBe('Carlos Alberto');
      expect(res.body.telefono).toBe('976543210');
    });

    test('Debe retornar 404 si el cliente a actualizar no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/clientes/9999')
        .set('Authorization', `Bearer ${tokenValido}`)
        .send({
          nombres: 'No existe',
          apellidos: 'No existe',
          email: 'noexiste@gmail.com',
          telefono: '000000000',
          direccion: 'No existe',
          dni: '00000000',
          estado: 'ACTIVO'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Cliente no encontrado');
    });
  });

  // ===== DELETE =====
  describe('DELETE /api/clientes/:id', () => {
    test('Debe eliminar un cliente existente con status 200', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 4, nombres: 'Carlos' }] });

      const res = await request(app)
        .delete('/api/clientes/4')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('mensaje', 'Cliente eliminado correctamente');
    });

    test('Debe retornar 404 al eliminar cliente inexistente', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/clientes/9999')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Cliente no encontrado');
    });
  });
});