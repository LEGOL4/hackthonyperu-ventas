const request = require('supertest');
const express = require('express');
const cors = require('cors');

jest.mock('../config/db', () => ({
    query: jest.fn()
}));

const pool = require('../config/db');
const { generarToken } = require('../config/jwt');
const categoriaRoutes = require('../routes/categorias.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/categorias', categoriaRoutes);

describe('API Categorias - Pruebas Unitarias con Mocking de BD', () => {
    let tokenValido;

    beforeAll(() => {
        tokenValido = generarToken({
            id: 1, email: 'admin@hack.com', rol: 'ADMIN', nombres: 'Leonardo'
        });
    });

    beforeEach(() => { jest.clearAllMocks(); });

    // ===== GET ALL =====
    describe('GET /api/categorias', () => {
        test('Debe retornar 401 si no se proporciona token', async () => {
            const res = await request(app).get('/api/categorias');
            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('mensaje', 'Token no proporcionado');
        });

        test('Debe retornar lista de categorias con status 200', async () => {
            const mockCategorias = [
                { id: 1, nombre: 'Software', descripcion: 'Productos y licencias', estado: 'ACTIVO' },
                { id: 2, nombre: 'Consultoría', descripcion: 'Servicios tecnológicos', estado: 'ACTIVO' }
            ];
            pool.query.mockResolvedValueOnce({ rows: mockCategorias });

            const res = await request(app)
                .get('/api/categorias')
                .set('Authorization', `Bearer ${tokenValido}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0].nombre).toBe('Software');
        });

        test('Debe retornar 500 si la base de datos falla', async () => {
            pool.query.mockRejectedValueOnce(new Error('DB Error'));

            const res = await request(app)
                .get('/api/categorias')
                .set('Authorization', `Bearer ${tokenValido}`);

            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('mensaje', 'Error al obtener categorías');
        });
    });

    // ===== GET BY ID =====
    describe('GET /api/categorias/:id', () => {
        test('Debe retornar una categoria existente con status 200', async () => {
            const mockCategoria = { id: 1, nombre: 'Software', estado: 'ACTIVO' };
            pool.query.mockResolvedValueOnce({ rows: [mockCategoria] });

            const res = await request(app)
                .get('/api/categorias/1')
                .set('Authorization', `Bearer ${tokenValido}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('id', 1);
            expect(res.body.nombre).toBe('Software');
        });

        test('Debe retornar 404 si la categoria no existe', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/api/categorias/9999')
                .set('Authorization', `Bearer ${tokenValido}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('mensaje', 'Categoría no encontrada');
        });
    });

    // ===== POST =====
    describe('POST /api/categorias', () => {
        test('Debe crear una nueva categoria con status 201', async () => {
            const nuevaCategoria = { nombre: 'Hardware', descripcion: 'Equipos físicos' };
            pool.query.mockResolvedValueOnce({
                rows: [{ id: 3, ...nuevaCategoria, estado: 'ACTIVO' }]
            });

            const res = await request(app)
                .post('/api/categorias')
                .set('Authorization', `Bearer ${tokenValido}`)
                .send(nuevaCategoria);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('id', 3);
            expect(res.body.nombre).toBe('Hardware');
        });

        test('Debe retornar 400 si el nombre es requerido', async () => {
            const res = await request(app)
                .post('/api/categorias')
                .set('Authorization', `Bearer ${tokenValido}`)
                .send({ descripcion: 'Sin nombre' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('mensaje', 'El nombre es requerido');
        });

        test('Debe retornar 400 si el nombre ya existe', async () => {
            const errorDb = new Error('Unique constraint violation');
            errorDb.code = '23505';
            pool.query.mockRejectedValueOnce(errorDb);

            const res = await request(app)
                .post('/api/categorias')
                .set('Authorization', `Bearer ${tokenValido}`)
                .send({ nombre: 'Software' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('mensaje', 'El nombre de categoría ya existe');
        });
    });

    // ===== PUT =====
    describe('PUT /api/categorias/:id', () => {
        test('Debe actualizar una categoria existente con status 200', async () => {
            const datosActualizados = { nombre: 'Software Actualizado', descripcion: 'Nueva desc', estado: 'ACTIVO' };
            pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...datosActualizados }] });

            const res = await request(app)
                .put('/api/categorias/1')
                .set('Authorization', `Bearer ${tokenValido}`)
                .send(datosActualizados);

            expect(res.statusCode).toBe(200);
            expect(res.body.nombre).toBe('Software Actualizado');
        });

        test('Debe retornar 404 si la categoria no existe', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .put('/api/categorias/9999')
                .set('Authorization', `Bearer ${tokenValido}`)
                .send({ nombre: 'No existe', estado: 'ACTIVO' });

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('mensaje', 'Categoría no encontrada');
        });
    });

    // ===== DELETE =====
    describe('DELETE /api/categorias/:id', () => {
        test('Debe eliminar una categoria con status 200', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Software' }] });

            const res = await request(app)
                .delete('/api/categorias/1')
                .set('Authorization', `Bearer ${tokenValido}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('mensaje', 'Categoría eliminada correctamente');
        });

        test('Debe retornar 404 al eliminar categoria inexistente', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .delete('/api/categorias/9999')
                .set('Authorization', `Bearer ${tokenValido}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('mensaje', 'Categoría no encontrada');
        });

        test('Debe retornar 400 si la categoria tiene productos asociados', async () => {
            const errorDb = new Error('Foreign key violation');
            errorDb.code = '23503';
            pool.query.mockRejectedValueOnce(errorDb);

            const res = await request(app)
                .delete('/api/categorias/1')
                .set('Authorization', `Bearer ${tokenValido}`);

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('mensaje', 'No se puede eliminar, tiene productos asociados');
        });
    });
});