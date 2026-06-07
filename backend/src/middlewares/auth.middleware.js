const { verificarToken } = require('../config/jwt');

const verificarAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    // Solo validación local del JWT — sin consulta a BD
    const payload = verificarToken(token);
    req.usuario = payload;
    next();

  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido', error: error.message });
  }
};

const verificarRol = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para esta acción' });
    }
    next();
  };
};

module.exports = { verificarAuth, verificarRol };