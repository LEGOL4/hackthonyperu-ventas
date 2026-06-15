const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generarToken } = require('../config/jwt');
const crypto = require('crypto');
const { enviarEmailRecuperacion } = require('../config/email');

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

const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ mensaje: 'El email es requerido' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1', [email]
    );

    // Siempre responder igual para no revelar si el email existe
    if (result.rows.length === 0) {
      return res.json({ mensaje: 'Si el email existe recibirás un correo en breve' });
    }

    const usuario = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 30);

    await pool.query(
      `UPDATE usuarios SET token_recuperacion = $1, token_expiracion = $2 WHERE id = $3`,
      [token, expiracion, usuario.id]
    );

    await enviarEmailRecuperacion(email, token);

    res.json({ mensaje: 'Si el email existe recibirás un correo en breve' });
  } catch (error) {
    console.error('Error en recuperación:', error.message);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud', error: error.message });
  }
};

const restablecerPassword = async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ mensaje: 'Token y nueva contraseña son requeridos' });
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 8 caracteres' });
    }

    const result = await pool.query(
      `SELECT * FROM usuarios 
       WHERE token_recuperacion = $1 
       AND token_expiracion > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ mensaje: 'Token inválido o expirado' });
    }

    const usuario = result.rows[0];
    const hash = await bcrypt.hash(nuevaPassword, 10);

    await pool.query(
      `UPDATE usuarios 
       SET password_hash = $1, token_recuperacion = NULL, token_expiracion = NULL 
       WHERE id = $2`,
      [hash, usuario.id]
    );

    res.json({ mensaje: 'Contraseña restablecida correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al restablecer contraseña', error: error.message });
  }
};

module.exports = { login, logout, getMe, solicitarRecuperacion, restablecerPassword };