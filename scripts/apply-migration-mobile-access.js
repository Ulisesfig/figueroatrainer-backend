/**
 * Aplica la migración que agrega la columna mobile_enabled a la tabla users.
 * Ejecutar con: node scripts/apply-migration-mobile-access.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/database');

async function main() {
  console.log('🔄 Aplicando migración: mobile_enabled en users...');

  const sqlPath = path.join(__dirname, '../src/config/migration_add_mobile_access.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await query(sql);

  console.log('✅ Migración aplicada correctamente.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error aplicando migración:', err.message);
  process.exit(1);
});
