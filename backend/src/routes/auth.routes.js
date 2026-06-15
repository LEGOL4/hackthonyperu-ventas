const express = require('express');
const router = express.Router();
const { 
  login, 
  logout, 
  getMe,
  solicitarRecuperacion,
  restablecerPassword
} = require('../controllers/auth.controller');
const { verificarAuth } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/logout', verificarAuth, logout);
router.get('/me', verificarAuth, getMe);
router.post('/recuperar', solicitarRecuperacion);
router.post('/restablecer', restablecerPassword);

module.exports = router;