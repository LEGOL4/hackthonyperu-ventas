const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviarEmailRecuperacion = async (destinatario, token) => {
  const enlace = `http://localhost/?token=${token}`;
  await transporter.sendMail({
    from: `"HACKTHONYPERU Sistema" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Recuperación de contraseña — GRUPO HACKTHONYPERU S.A.C',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2 style="color: #1e3a8a;">GRUPO HACKTHONYPERU S.A.C</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente botón para continuar:</p>
        <a href="${enlace}" style="
          display: inline-block;
          background-color: #1e3a8a;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin: 16px 0;
        ">Restablecer contraseña</a>
        <p style="color: #666; font-size: 13px;">
          Este enlace expira en <strong>30 minutos</strong>.<br/>
          Si no solicitaste este cambio, ignora este mensaje.
        </p>
        <hr/>
        <p style="color: #999; font-size: 12px;">
          GRUPO HACKTHONYPERU S.A.C — Sistema de Ventas © 2026
        </p>
      </div>
    `,
  });
};

module.exports = { enviarEmailRecuperacion };