// Ejecuta la migración de last_login en la DB
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

(async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sqlPath = path.join(__dirname, '..', 'src', 'config', 'migration_add_last_login.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('▶️ Ejecutando migración last_login...');
    await pool.query(sql);
    console.log('✅ Migración aplicada');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error aplicando migración:', e.message);
    process.exit(1);
  }
})();
