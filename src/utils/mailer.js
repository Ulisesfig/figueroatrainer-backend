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

/**
 * Envía notificación de pago al administrador con detalles completos
 */
async function sendPaymentNotificationToAdmin(paymentData) {
  const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || 'ulefigueroa@gmail.com';
  const from = process.env.FROM_EMAIL || 'info@figueroatrainer.com';

  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY no configurado');
    console.log(`[MAILER] ⚠️ Notificación simulada de pago - Plan: ${paymentData.planType}`);
    return { simulated: true };
  }

  sgMail.setApiKey(apiKey);

  const {
    userName,
    userEmail,
    userPhone,
    planType,
    amount,
    currency,
    paymentId,
    paymentMethod,
    paymentType,
    status,
    createdAt
  } = paymentData;

  const subject = `💰 Nueva Compra - ${planType} - ${userName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #28a745; margin-top: 0;">✅ Nuevo Pago Confirmado</h2>
        
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2e7d32;">
            ${planType}
          </p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1b5e20;">
            ${currency} ${amount}
          </p>
        </div>

        <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
          👤 Datos del Cliente
        </h3>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Nombre:</strong></td>
            <td style="padding: 8px 0;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
            <td style="padding: 8px 0;">${userEmail}</td>
          </tr>
          ${userPhone ? `
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Teléfono:</strong></td>
            <td style="padding: 8px 0;">${userPhone}</td>
          </tr>
          ` : ''}
        </table>

        <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
          💳 Detalles del Pago
        </h3>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>ID de Pago:</strong></td>
            <td style="padding: 8px 0; font-family: monospace;">${paymentId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Método:</strong></td>
            <td style="padding: 8px 0;">${paymentMethod || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Tipo:</strong></td>
            <td style="padding: 8px 0;">${paymentType || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Estado:</strong></td>
            <td style="padding: 8px 0;">
              <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">
                ${status}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Fecha:</strong></td>
            <td style="padding: 8px 0;">${new Date(createdAt).toLocaleString('es-AR')}</td>
          </tr>
        </table>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;">
            <strong>⚡ Acción requerida:</strong> Asigná ejercicios y rutinas personalizadas al cliente en la plataforma.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.ADMIN_PANEL_URL || 'https://figueroatrainer.netlify.app/pages/admin.html'}" 
             style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Ir al Panel de Admin
          </a>
        </div>
      </div>

      <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
        Figueroa Trainer - Sistema de Pagos
      </p>
    </div>
  `;

  const text = `
NUEVA COMPRA CONFIRMADA

CLIENTE:
- Nombre: ${userName}
- Email: ${userEmail}
${userPhone ? `- Teléfono: ${userPhone}` : ''}

PLAN:
- Tipo: ${planType}
- Monto: ${currency} ${amount}

PAGO:
- ID: ${paymentId}
- Método: ${paymentMethod || 'N/A'}
- Estado: ${status}
- Fecha: ${new Date(createdAt).toLocaleString('es-AR')}

Asigná ejercicios al cliente desde el panel de admin.
  `;

  const msg = {
    to: adminEmail,
    from: from,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    console.log('📧 Enviando notificación de pago al admin:', adminEmail);
    const response = await sgMail.send(msg);
    console.log('✅ Notificación enviada exitosamente!');
    return {
      success: true,
      statusCode: response[0].statusCode,
      messageId: response[0].headers['x-message-id']
    };
  } catch (error) {
    console.error('❌ Error al enviar notificación de pago:');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response Body:', JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
}

/**
 * Envía confirmación de compra al cliente
 */
async function sendPaymentConfirmationToClient(clientData) {
  const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || 'info@figueroatrainer.com';

  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY no configurado');
    console.log(`[MAILER] ⚠️ Confirmación simulada enviada a ${clientData.userEmail}`);
    return { simulated: true };
  }

  sgMail.setApiKey(apiKey);

  const { userName, userEmail, planType, amount, currency, paymentId } = clientData;

  const subject = '✅ Pago Confirmado - Figueroa Trainer';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">¡Gracias por tu compra!</h1>
      </div>
      
      <div style="background: white; padding: 30px;">
        <p style="font-size: 18px; color: #333;">Hola <strong>${userName}</strong>,</p>
        
        <p style="color: #666;">Tu pago ha sido confirmado exitosamente. ¡Bienvenido a Figueroa Trainer!</p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #333;">Plan Adquirido</h3>
          <p style="font-size: 20px; font-weight: bold; color: #667eea; margin: 10px 0;">${planType}</p>
          <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${currency} ${amount}</p>
        </div>

        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32;">
            <strong>📋 Próximos pasos:</strong><br>
            En las próximas 24 horas recibirás tu rutina personalizada y acceso completo a la plataforma.
            Te contactaremos por WhatsApp para coordinar los detalles.
          </p>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          ID de transacción: ${paymentId}
        </p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; text-align: center;">
        <p style="color: #666; margin: 0;">¿Tenés alguna duda? Contactanos!</p>
        <p style="color: #667eea; margin: 5px 0; font-weight: bold;">contacto@figueroatrainer.com</p>
      </div>
    </div>
  `;

  const text = `
Hola ${userName},

¡Tu pago ha sido confirmado!

Plan: ${planType}
Monto: ${currency} ${amount}

En las próximas 24 horas recibirás tu rutina personalizada.

ID de transacción: ${paymentId}

Gracias por confiar en Figueroa Trainer!
  `;

  const msg = {
    to: userEmail,
    from: from,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    console.log('📧 Enviando confirmación al cliente:', userEmail);
    const response = await sgMail.send(msg);
    console.log('✅ Confirmación enviada exitosamente!');
    return {
      success: true,
      statusCode: response[0].statusCode
    };
  } catch (error) {
    console.error('❌ Error al enviar confirmación al cliente:', error.message);
    throw error;
  }
}

module.exports = { 
  sendPasswordResetCode,
  sendPaymentNotificationToAdmin,
  sendPaymentConfirmationToClient
};
