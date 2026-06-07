const pool = require('../config/db');

const getProductos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM productos');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ORDER BY p.fecha_registro DESC
       LIMIT $1 OFFSET $2`,
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
    res.status(500).json({ mensaje: 'Error al obtener productos', error });
  }
};

const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener producto', error });
  }
};

const createProducto = async (req, res) => {
  try {
    const { categoria_id, nombre, descripcion, precio, stock, stock_minimo, imagen_url } = req.body;
    if (!categoria_id || !nombre || !precio) {
      return res.status(400).json({ mensaje: 'Categoría, nombre y precio son requeridos' });
    }
    const result = await pool.query(
      `INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, stock_minimo, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [categoria_id, nombre, descripcion || null, precio, stock || 0, stock_minimo || 5, imagen_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
  }
};

const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria_id, nombre, descripcion, precio, stock, stock_minimo, imagen_url, estado } = req.body;
    const result = await pool.query(
      `UPDATE productos SET categoria_id=$1, nombre=$2, descripcion=$3,
       precio=$4, stock=$5, stock_minimo=$6, imagen_url=$7, estado=$8
       WHERE id=$9 RETURNING *`,
      [categoria_id, nombre, descripcion || null, precio, stock, stock_minimo || 5, imagen_url || null, estado || 'ACTIVO', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar producto', error });
  }
};

const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM productos WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar producto', error });
  }
};

module.exports = {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
};