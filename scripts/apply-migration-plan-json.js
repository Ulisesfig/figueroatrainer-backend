// Ejecuta la migración para agregar content_json a plans
try {
  require('dotenv').config();
} catch (err) {}

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

(async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sqlPath = path.join(__dirname, '..', 'src', 'config', 'migration_add_plan_json.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('▶️ Ejecutando migración: content_json en plans...');
    await pool.query(sql);
    console.log('✅ Migración aplicada');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error aplicando migración:', e);
    process.exit(1);
  }
})();
