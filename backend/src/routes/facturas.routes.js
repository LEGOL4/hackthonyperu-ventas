const express = require('express');
const router = express.Router();
const {
  getFacturas,
  getFacturaById,
  createFactura,
  anularFactura,
  getReportes
} = require('../controllers/facturas.controller');
const { verificarAuth } = require('../middlewares/auth.middleware');

router.get('/reportes', verificarAuth, getReportes);
router.get('/', verificarAuth, getFacturas);
router.get('/:id', verificarAuth, getFacturaById);
router.post('/', verificarAuth, createFactura);
router.put('/:id/anular', verificarAuth, anularFactura);

module.exports = router;