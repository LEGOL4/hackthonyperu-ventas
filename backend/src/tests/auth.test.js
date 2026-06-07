const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Mockear base de datos y bcryptjs antes de importar rutas
jest.mock('../config/db', () => ({
  query: jest.fn()
}));
jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generarToken } = require('../config/jwt');
const authRoutes = require('../routes/auth.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('API Auth - Pruebas de Integración con Mocking', () => {
  let tokenValido;

  beforeAll(() => {
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

  // ===== POST /login =====
  describe('POST /api/auth/login', () => {
    test('Debe retornar 400 si falta el email o la contraseña', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@hack.com' }); // Falta password

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Email y contraseña son requeridos');
    });

    test('Debe retornar 401 si el usuario no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // Ningún usuario retornado

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noexiste@hack.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('mensaje', 'Credenciales incorrectas');
    });

    test('Debe retornar 401 si el usuario está bloqueado', async () => {
      const mockUsuarioBloqueado = {
        id: 2,
        email: 'blocked@hack.com',
        estado: 'BLOQUEADO'
      };
      pool.query.mockResolvedValueOnce({ rows: [mockUsuarioBloqueado] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'blocked@hack.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('mensaje', 'Usuario bloqueado. Contacte al administrador');
    });

    test('Debe iniciar sesión exitosamente si las credenciales son correctas', async () => {
      const mockUsuario = {
        id: 1,
        email: 'admin@hack.com',
        nombres: 'Leonardo',
        apellidos: 'García',
        rol: 'ADMIN',
        estado: 'ACTIVO',
        password_hash: 'hashed_password'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [mockUsuario] }) // SELECT usuario
        .mockResolvedValueOnce({}) // UPDATE intentos_fallidos = 0
        .mockResolvedValueOnce({}); // INSERT sesiones

      bcrypt.compare.mockResolvedValueOnce(true); // Contraseña válida

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@hack.com', password: 'correct_password' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('mensaje', 'Login exitoso');
      expect(res.body).toHaveProperty('token');
      expect(res.body.usuario.nombres).toBe('Leonardo');
      expect(res.body.usuario.rol).toBe('ADMIN');
      expect(bcrypt.compare).toHaveBeenCalledWith('correct_password', 'hashed_password');
    });

    test('Debe incrementar intentos fallidos y retornar 401 si la contraseña es incorrecta', async () => {
      const mockUsuario = {
        id: 1,
        email: 'admin@hack.com',
        password_hash: 'hashed_password',
        estado: 'ACTIVO'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [mockUsuario] }) // SELECT usuario
        .mockResolvedValueOnce({}); // UPDATE intentos_fallidos = intentos_fallidos + 1

      bcrypt.compare.mockResolvedValueOnce(false); // Contraseña incorrecta

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@hack.com', password: 'wrong_password' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('mensaje', 'Credenciales incorrectas');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1'),
        [1]
      );
    });
  });

  // ===== POST /logout =====
  describe('POST /api/auth/logout', () => {
    test('Debe retornar 401 si no hay token', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toBe(401);
    });

    test('Debe cerrar sesión correctamente y desactivar token en base de datos', async () => {
      pool.query.mockResolvedValueOnce({}); // UPDATE sesiones

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('mensaje', 'Sesión cerrada correctamente');
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE sesiones SET activa = FALSE WHERE token = $1',
        [tokenValido]
      );
    });
  });

  // ===== GET /me =====
  describe('GET /api/auth/me', () => {
    test('Debe obtener la información del usuario autenticado', async () => {
      const mockUsuarioInfo = {
        id: 1,
        nombres: 'Leonardo',
        apellidos: 'García',
        email: 'admin@hack.com',
        rol: 'ADMIN',
        estado: 'ACTIVO'
      };
      pool.query.mockResolvedValueOnce({ rows: [mockUsuarioInfo] });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenValido}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('admin@hack.com');
      expect(res.body.rol).toBe('ADMIN');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, nombres, apellidos, email, rol, estado, fecha_registro FROM usuarios'),
        [1]
      );
    });
  });
});
