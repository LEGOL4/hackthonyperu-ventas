const pool = require('../config/db');

const getCategorias = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categorias ORDER BY nombre ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías', error });
  }
};

const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM categorias WHERE id = $1', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categoría', error });
  }
};

const createCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre es requerido' });
    }
    const result = await pool.query(
      `INSERT INTO categorias (nombre, descripcion)
       VALUES ($1, $2) RETURNING *`,
      [nombre, descripcion || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ mensaje: 'El nombre de categoría ya existe' });
    }
    res.status(500).json({ mensaje: 'Error al crear categoría', error: error.message });
  }
};

const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;
    const result = await pool.query(
      `UPDATE categorias SET nombre=$1, descripcion=$2, estado=$3
       WHERE id=$4 RETURNING *`,
      [nombre, descripcion || null, estado || 'ACTIVO', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar categoría', error });
  }
};

const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM categorias WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }
    res.json({ mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ mensaje: 'No se puede eliminar, tiene productos asociados' });
    }
    res.status(500).json({ mensaje: 'Error al eliminar categoría', error });
  }
};

module.exports = {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
};