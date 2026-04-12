#!/usr/bin/env node
/**
 * Script de diagnóstico SMTP
 * Prueba diferentes configuraciones de SMTP2GO
 */

const nodemailer = require('nodemailer');

async function testConnection(config, name) {
  console.log(`\n🔍 Probando: ${name}`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   User: ${config.auth.user}`);
  
  const transporter = nodemailer.createTransport({
    ...config,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
  
  try {
    await transporter.verify();
    console.log(`   ✅ Conexión exitosa!`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    return false;
  }
}

async function main() {
  console.log('🔧 Diagnóstico de Conexión SMTP con SMTP2GO\n');
  
  const apiKey = process.env.SMTP_PASS;
  if (!apiKey) {
    console.error('❌ SMTP_PASS no está configurado');
    process.exit(1);
  }
  
  const configs = [
    {
      name: 'SMTP2GO Puerto 587 (sin TLS)',
      host: process.env.SMTP_HOST || 'mail.smtp2go.com',
      port: 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: apiKey }
    },
    {
      name: 'SMTP2GO Puerto 2525 (alternativo)',
      host: process.env.SMTP_HOST || 'mail.smtp2go.com',
      port: 2525,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: apiKey }
    },
    {
      name: 'SMTP2GO Puerto 465 (SSL)',
      host: process.env.SMTP_HOST || 'mail.smtp2go.com',
      port: 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: apiKey }
    }
  ];
  
  console.log('Variables de entorno:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`SMTP_PASS: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NO CONFIGURADO'}`);
  console.log(`SMTP_SECURE: ${process.env.SMTP_SECURE}`);
  console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL}`);
  
  let anySuccess = false;
  for (const config of configs) {
    const success = await testConnection(config, config.name);
    if (success) anySuccess = true;
  }
  
  if (anySuccess) {
    console.log('\n✅ Al menos una configuración funciona!');
    process.exit(0);
  } else {
    console.log('\n❌ Ninguna configuración funciona.');
    console.log('\n💡 Posibles causas:');
    console.log('   1. Credenciales SMTP2GO inválidas o expirada');
    console.log('   2. Railway bloqueando puertos SMTP (común en plataformas cloud)');
    console.log('   3. Usuario o password SMTP2GO incorrectos');
    console.log('   4. Verificar en el panel de SMTP2GO las credenciales SMTP');
    process.exit(1);
  }
}

main();
