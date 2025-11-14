#!/usr/bin/env node
/*
  Script para crear la tabla password_resets en Railway
  Uso: node scripts/create-password-resets-table.js
  ó en Railway: railway run node scripts/create-password-resets-table.js
*/

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL });

const sql = `
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(12) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_code ON password_resets(code);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
`;

async function main() {
  try {
    console.log('Conectando a la base de datos...');
    await pool.query(sql);
    console.log('✅ Tabla password_resets creada exitosamente (o ya existía)');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creando tabla:', err.message);
    await pool.end();
    process.exit(1);
  }
}

main();
