const express = require('express');
const router = express.Router();
const {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
} = require('../controllers/categorias.controller');
const { verificarAuth } = require('../middlewares/auth.middleware');

router.get('/', verificarAuth, getCategorias);
router.get('/:id', verificarAuth, getCategoriaById);
router.post('/', verificarAuth, createCategoria);
router.put('/:id', verificarAuth, updateCategoria);
router.delete('/:id', verificarAuth, deleteCategoria);

module.exports = router;