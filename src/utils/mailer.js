const nodemailer = require('nodemailer');
const https = require('https');
const MAILBOX_TO = 'info@figueroatrainer.com';

function getSmtpTransporter(port, secure) {
  const host = process.env.SMTP_HOST || 'mail.smtp2go.com';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    auth: {
      user,
      pass,
    },
  });
}

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.FROM_EMAIL || 'info@figueroatrainer.com';
  const smtp2goApiKey = process.env.SMTP2GO_API_KEY;
  const preferredPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const attemptedPorts = [preferredPort, 587, 2525, 465]
    .filter((p, i, arr) => Number.isFinite(p) && arr.indexOf(p) === i);

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('⚠️ Configuracion SMTP incompleta. Se omite el envio de email.');
    return { simulated: true, reason: 'missing_smtp_credentials' };
  }

  if (smtp2goApiKey && /^api-[A-Za-z0-9]{32}$/.test(smtp2goApiKey)) {
    try {
      const apiResult = await new Promise((resolve, reject) => {
        const payload = JSON.stringify({
          api_key: smtp2goApiKey,
          to: [MAILBOX_TO],
          sender: from,
          subject,
          text_body: text,
          html_body: html,
        });

        const req = https.request('https://api.smtp2go.com/v3/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'X-Smtp2go-Api-Key': smtp2goApiKey,
          },
          timeout: 10000,
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                success: true,
                messageId: null,
                accepted: [MAILBOX_TO],
                response: data,
              });
              return;
            }
            reject(new Error(`SMTP2GO API ${res.statusCode}: ${data}`));
          });
        });

        req.on('timeout', () => {
          req.destroy(new Error('SMTP2GO API timeout'));
        });
        req.on('error', (err) => reject(err));
        req.write(payload);
        req.end();
      });

      return apiResult;
    } catch (apiError) {
      console.warn(`⚠️ Fallo SMTP2GO API, se intenta SMTP: ${apiError.message}`);
    }
  }

  let lastError = null;

  for (const port of attemptedPorts) {
    const secure = port === 465;
    const transporter = getSmtpTransporter(port, secure);
    try {
      const info = await transporter.sendMail({
        from,
        to: MAILBOX_TO,
        subject,
        text,
        html,
      });

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        response: info.response,
      };
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Falla SMTP en puerto ${port}: ${error.message}`);
    }
  }

  throw lastError || new Error('No se pudo enviar email por SMTP');
}

async function sendPasswordResetCode(toEmail, code) {
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

  try {
    console.log(`📧 Enviando código de recuperación al buzón único ${MAILBOX_TO} (solicitado por ${toEmail})`);
    const result = await sendEmail({
      to: toEmail,
      subject,
      text,
      html,
    });

    if (result.simulated) {
      console.log(`[MAILER] ⚠️ Envío simulado a ${MAILBOX_TO}: código ${code} (solicitado por ${toEmail})`);
      return result;
    }

    console.log('✅ Email enviado exitosamente!');
    console.log('   Destinatario:', MAILBOX_TO);
    console.log('   Message ID:', result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
    };
  } catch (error) {
    console.error('❌ Error al enviar email de recuperación:');
    console.error('   Destinatario:', MAILBOX_TO);
    console.error('   Error:', error.message);
    throw error;
  }
}

async function sendPaymentNotificationToAdmin(paymentData) {
  const adminEmail = process.env.ADMIN_EMAIL || MAILBOX_TO;
  const { userName, userEmail, userPhone, planType, amount, currency, paymentId, paymentMethod, paymentType, status, createdAt } = paymentData;

  const subject = `💰 Nueva Compra - ${planType} - ${userName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #28a745; margin-top: 0;">✅ Nuevo Pago Confirmado</h2>
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2e7d32;">${planType}</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1b5e20;">${currency} ${amount}</p>
        </div>
        <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">👤 Datos del Cliente</h3>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr><td style="padding: 8px 0; color: #666;"><strong>Nombre:</strong></td><td style="padding: 8px 0;">${userName}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td><td style="padding: 8px 0;">${userEmail}</td></tr>
          ${userPhone ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Teléfono:</strong></td><td style="padding: 8px 0;">${userPhone}</td></tr>` : ''}
        </table>
        <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">💳 Detalles del Pago</h3>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr><td style="padding: 8px 0; color: #666;"><strong>ID de Pago:</strong></td><td style="padding: 8px 0; font-family: monospace;">${paymentId}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Método:</strong></td><td style="padding: 8px 0;">${paymentMethod || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Tipo:</strong></td><td style="padding: 8px 0;">${paymentType || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Estado:</strong></td><td style="padding: 8px 0;"><span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">${status}</span></td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Fecha:</strong></td><td style="padding: 8px 0;">${new Date(createdAt).toLocaleString('es-AR')}</td></tr>
        </table>
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;"><strong>⚡ Acción requerida:</strong> Asigná ejercicios y rutinas personalizadas al cliente en la plataforma.</p>
        </div>
      </div>
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

  try {
    console.log(`📧 Enviando notificación de pago al buzón único ${MAILBOX_TO} (admin configurado: ${adminEmail})`);
    const result = await sendEmail({
      to: adminEmail,
      subject,
      text,
      html,
    });

    if (result.simulated) {
      console.log(`[MAILER] ⚠️ Notificación simulada de pago - Plan: ${paymentData.planType}`);
      return result;
    }

    console.log('✅ Notificación enviada exitosamente!');
    return {
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
    };
  } catch (error) {
    console.error('❌ Error al enviar notificación de pago:', error.message);
    throw error;
  }
}

async function sendPaymentConfirmationToClient(clientData) {
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
          <p style="margin: 0; color: #2e7d32;"><strong>📋 Próximos pasos:</strong><br>En las próximas 24 horas recibirás tu rutina personalizada y acceso completo a la plataforma.</p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">ID de transacción: ${paymentId}</p>
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

  try {
    console.log(`📧 Enviando confirmación al buzón único ${MAILBOX_TO} (cliente original: ${userEmail})`);
    const result = await sendEmail({
      to: userEmail,
      subject,
      text,
      html,
    });

    if (result.simulated) {
      console.log(`[MAILER] ⚠️ Confirmación simulada enviada a ${MAILBOX_TO} (cliente original: ${clientData.userEmail})`);
      return result;
    }

    console.log('✅ Confirmación enviada exitosamente!');
    return {
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
    };
  } catch (error) {
    console.error('❌ Error al enviar confirmación al cliente:', error.message);
    throw error;
  }
}

async function sendContactNotificationToAdmin(contactData) {
  const adminEmail = process.env.ADMIN_EMAIL || MAILBOX_TO;
  const { name, email, topic, message, createdAt } = contactData;

  const topicLabels = {
    planes: 'Planes y tarifas',
    rutina: 'Dudas sobre rutina',
    nutricion: 'Consulta de nutricion',
    tienda: 'Pedido en tienda',
    otro: 'Otro',
  };
  const topicLabel = topicLabels[topic] || topic;

  const subject = `📩 Nuevo contacto: ${topicLabel} - ${name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color: #111827;">Nuevo mensaje de contacto</h2>
      <p style="color: #374151;">Se recibió una nueva consulta desde la pagina de contacto.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Nombre</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${email}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Tema</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${topicLabel}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Fecha</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(createdAt || Date.now()).toLocaleString('es-AR')}</td></tr>
      </table>
      <div style="padding: 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p style="margin: 0 0 8px 0;"><strong>Mensaje:</strong></p>
        <p style="margin: 0; white-space: pre-wrap; color: #111827;">${message}</p>
      </div>
    </div>
  `;

  const text = `
Nuevo mensaje de contacto

Nombre: ${name}
Email: ${email}
Tema: ${topicLabel}
Fecha: ${new Date(createdAt || Date.now()).toLocaleString('es-AR')}

Mensaje:
${message}
  `;

  try {
    console.log(`📧 Enviando notificación de contacto al buzón único ${MAILBOX_TO} (admin configurado: ${adminEmail})`);
    const result = await sendEmail({
      to: adminEmail,
      subject,
      text,
      html,
    });

    if (result.simulated) {
      console.log(`[MAILER] ⚠️ Contacto recibido sin envio de email. Buzón objetivo: ${MAILBOX_TO}`);
      return result;
    }

    console.log('✅ Notificación de contacto enviada exitosamente');
    return {
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
    };
  } catch (error) {
    console.error('❌ Error al enviar email de contacto:', error.message);
    throw error;
  }
}

module.exports = {
  sendPasswordResetCode,
  sendPaymentNotificationToAdmin,
  sendPaymentConfirmationToClient,
  sendContactNotificationToAdmin,
};
