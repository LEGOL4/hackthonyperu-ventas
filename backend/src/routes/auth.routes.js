const express = require('express');
const router = express.Router();
const { login, logout, getMe } = require('../controllers/auth.controller');
const { verificarAuth } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/logout', verificarAuth, logout);
router.get('/me', verificarAuth, getMe);

module.exports = router;