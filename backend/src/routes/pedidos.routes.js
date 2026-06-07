const express = require('express');
const router = express.Router();
const {
  getPedidos,
  getPedidoById,
  createPedido,
  updateEstadoPedido
} = require('../controllers/pedidos.controller');
const { verificarAuth } = require('../middlewares/auth.middleware');

router.get('/', verificarAuth, getPedidos);
router.get('/:id', verificarAuth, getPedidoById);
router.post('/', verificarAuth, createPedido);
router.put('/:id/estado', verificarAuth, updateEstadoPedido);

module.exports = router;