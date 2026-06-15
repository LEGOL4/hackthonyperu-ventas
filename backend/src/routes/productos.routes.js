const express = require('express');
const router = express.Router();
const {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getAlertasStock,
} = require('../controllers/productos.controller');
const { verificarAuth } = require('../middlewares/auth.middleware');

// ⚠️ /alertas-stock ANTES de /:id para que Express no lo interprete como un id
router.get('/alertas-stock', verificarAuth, getAlertasStock);

router.get('/',     verificarAuth, getProductos);
router.get('/:id',  verificarAuth, getProductoById);
router.post('/',    verificarAuth, createProducto);
router.put('/:id',  verificarAuth, updateProducto);
router.delete('/:id', verificarAuth, deleteProducto);

module.exports = router;