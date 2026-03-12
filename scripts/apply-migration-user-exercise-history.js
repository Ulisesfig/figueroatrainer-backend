// Ejecuta la migración de historial de pesos de usuario en la DB
try {
  require('dotenv').config();
} catch (_err) {
  // Ignorar si dotenv no está disponible
}

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

(async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sqlPath = path.join(__dirname, '..', 'src', 'config', 'migration_add_user_exercise_history.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('▶️ Ejecutando migración user_exercise_history...');
    await pool.query(sql);
    console.log('✅ Migración aplicada: tabla user_exercise_history creada/actualizada');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error aplicando migración:', e);
    process.exit(1);
  }
})();