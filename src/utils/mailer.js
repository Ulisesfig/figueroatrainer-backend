const sgMail = require('@sendgrid/mail');

/**
 * Envía código de recuperación usando SendGrid API HTTP
 * Usa SENDGRID_API_KEY en lugar de SMTP que puede ser bloqueado por firewalls
 */

async function sendPasswordResetCode(toEmail, code) {
  const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || 'info@figueroatrainer.com';

  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY no configurado');
    console.error('Configura SENDGRID_API_KEY en Railway con tu API Key de SendGrid');
    console.log(`[MAILER] ⚠️ Envío simulado a ${toEmail}: código ${code}`);
    return { simulated: true };
  }

  // Configurar SendGrid
  sgMail.setApiKey(apiKey);

  const subject = 'Código de recuperación - Figueroa Trainer';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Recuperación de contraseña</h2>
      <p>Usá el siguiente código para restablecer tu contraseña. Es válido por 10 minutos.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="font-size: 32px; letter-spacing: 4px; font-weight: bold; color: #000; margin: 0;">${code}</p>
      </div>
      <p style="color: #666;">Si no solicitaste este código, podés ignorar este email.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 12px; color: #999;">Figueroa Trainer - Tu entrenamiento personalizado</p>
    </div>
  `;
  const text = `Tu código de recuperación es: ${code}. Vence en 10 minutos. Si no solicitaste este código, podés ignorar este email.`;

  const msg = {
    to: toEmail,
    from: from,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    console.log('📧 Enviando email vía SendGrid API a:', toEmail);
    const response = await sgMail.send(msg);
    console.log('✅ Email enviado exitosamente!');
    console.log('   Destinatario:', toEmail);
    console.log('   Status Code:', response[0].statusCode);
    console.log('   Message ID:', response[0].headers['x-message-id']);
    return {
      success: true,
      statusCode: response[0].statusCode,
      messageId: response[0].headers['x-message-id'],
      accepted: [toEmail]
    };
  } catch (error) {
    console.error('❌ Error al enviar email via SendGrid API:');
    console.error('   Destinatario:', toEmail);
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response Body:', JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
}

module.exports = { sendPasswordResetCode };
