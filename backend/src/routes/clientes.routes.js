const express = require('express');
const router = express.Router();
const {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
} = require('../controllers/clientes.controller');
const { verificarAuth } = require('../middlewares/auth.middleware');

router.get('/', verificarAuth, getClientes);
router.get('/:id', verificarAuth, getClienteById);
router.post('/', verificarAuth, createCliente);
router.put('/:id', verificarAuth, updateCliente);
router.delete('/:id', verificarAuth, deleteCliente);

module.exports = router;