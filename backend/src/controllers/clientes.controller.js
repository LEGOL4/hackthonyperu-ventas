const pool = require('../config/db');

// Obtener clientes con paginación
const getClientes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM clientes');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM clientes ORDER BY fecha_registro DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener clientes', error });
  }
};

// Obtener un cliente por ID
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM clientes WHERE id = $1', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener cliente', error });
  }
};

// Crear nuevo cliente
const createCliente = async (req, res) => {
  try {
    const { nombres, apellidos, email, telefono, direccion, dni } = req.body;
    const result = await pool.query(
      `INSERT INTO clientes (nombres, apellidos, email, telefono, direccion, dni)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombres, apellidos, email, telefono, direccion, dni]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint === 'clientes_dni_key') {
        return res.status(400).json({ mensaje: 'El DNI ya está registrado' });
      }
      if (error.constraint === 'clientes_email_key') {
        return res.status(400).json({ mensaje: 'El email ya está registrado' });
      }
    }
    res.status(500).json({ mensaje: 'Error al crear cliente', error: error.message });
  }
};

// Actualizar cliente
const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, email, telefono, direccion, dni, estado } = req.body;
    const result = await pool.query(
      `UPDATE clientes SET nombres=$1, apellidos=$2, email=$3,
       telefono=$4, direccion=$5, dni=$6, estado=$7
       WHERE id=$8 RETURNING *`,
      [nombres, apellidos, email, telefono, direccion, dni, estado, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar cliente', error });
  }
};

// Eliminar cliente
const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM clientes WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar cliente', error });
  }
};

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
};