#!/usr/bin/env node
/*
  Envía un email de prueba usando la configuración SMTP_* del entorno.
  Uso:
    node scripts/send-test-email.js correo@destino.com
  ó
    npm run test-email -- correo@destino.com

  En Railway podés ejecutar:
    railway run npm run test-email -- correo@destino.com
*/

const { sendPasswordResetCode } = require('../src/utils/mailer');

async function main() {
  const to = process.argv[2] || process.env.TEST_EMAIL;
  if (!to) {
    console.error('Falta el destinatario. Uso: node scripts/send-test-email.js correo@destino.com');
    process.exit(1);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Intentando enviar email de prueba a ${to} ...`);
  console.log('Variables SMTP esperadas:', {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER ? '***' : undefined,
    SMTP_PASS: process.env.SMTP_PASS ? '***' : undefined,
    SMTP_SECURE: process.env.SMTP_SECURE,
    FROM_EMAIL: process.env.FROM_EMAIL,
  });

  try {
    const info = await sendPasswordResetCode(to, code);
    if (info && info.simulated) {
      console.log('Envío SIMULADO: faltan credenciales SMTP. Configurá SMTP_* en Railway.');
      process.exit(2);
    }
    console.log('Email enviado correctamente:', info && info.messageId ? info.messageId : info);
    process.exit(0);
  } catch (err) {
    console.error('Fallo al enviar email:', err.message);
    process.exit(1);
  }
}

main();
