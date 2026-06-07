const express = require('express');
const router = express.Router();
const {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} = require('../controllers/productos.controller');
const { verificarAuth } = require('../middlewares/auth.middleware');

router.get('/', verificarAuth, getProductos);
router.get('/:id', verificarAuth, getProductoById);
router.post('/', verificarAuth, createProducto);
router.put('/:id', verificarAuth, updateProducto);
router.delete('/:id', verificarAuth, deleteProducto);

module.exports = router;