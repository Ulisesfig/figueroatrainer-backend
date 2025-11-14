const nodemailer = require('nodemailer');

// Crea un transport configurable por variables de entorno
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE (true/false), FROM_EMAIL
function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP no configurado. Los emails no se enviarán en producción.');
    return null;
  }

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

async function sendPasswordResetCode(toEmail, code) {
  const transport = createTransport();
  const from = process.env.FROM_EMAIL || 'no-reply@figueroatrainer.com';

  const subject = 'Código de recuperación - Figueroa Trainer';
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Recuperación de contraseña</h2>
      <p>Usá el siguiente código para restablecer tu contraseña. Es válido por 10 minutos.</p>
      <p style="font-size: 22px; letter-spacing: 2px; font-weight: bold;">${code}</p>
      <p>Si no solicitaste este código, podés ignorar este email.</p>
    </div>
  `;
  const text = `Tu código de recuperación es: ${code}. Vence en 10 minutos.`;

  if (!transport) {
    // Entorno sin SMTP: loguear como fallback para desarrollo
    console.log(`[MAILER] Envío simulado a ${toEmail}: ${text}`);
    return { simulated: true };
  }

  const info = await transport.sendMail({ from, to: toEmail, subject, text, html });
  console.log('✉️ Email enviado:', info.messageId);
  return info;
}

module.exports = { sendPasswordResetCode };
