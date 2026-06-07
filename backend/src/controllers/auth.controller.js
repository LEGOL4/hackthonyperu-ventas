const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generarToken } = require('../config/jwt');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1', [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const usuario = result.rows[0];

    // Verificar estado
    if (usuario.estado === 'INACTIVO') {
      return res.status(401).json({ mensaje: 'Usuario inactivo' });
    }
    if (usuario.estado === 'BLOQUEADO') {
      return res.status(401).json({ mensaje: 'Usuario bloqueado. Contacte al administrador' });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      // Incrementar intentos fallidos
      await pool.query(
        'UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = $1',
        [usuario.id]
      );
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    // Resetear intentos fallidos
    await pool.query(
      'UPDATE usuarios SET intentos_fallidos = 0 WHERE id = $1',
      [usuario.id]
    );

    // Generar token
    const token = generarToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombres: usuario.nombres
    });

    // Registrar sesión
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + 8);

    await pool.query(
      `INSERT INTO sesiones (usuario_id, token, fecha_expiracion)
       VALUES ($1, $2, $3)`,
      [usuario.id, token, expiracion]
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await pool.query(
        'UPDATE sesiones SET activa = FALSE WHERE token = $1',
        [token]
      );
    }
    res.json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cerrar sesión', error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombres, apellidos, email, rol, estado, fecha_registro FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuario', error: error.message });
  }
};

module.exports = { login, logout, getMe };