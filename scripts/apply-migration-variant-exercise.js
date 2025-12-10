// Script para aplicar la migración de ejercicio variante
// Ejecutar con: node scripts/apply-migration-variant-exercise.js

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Aplicando migración: variant_exercise_id...');
    
    const sqlPath = path.join(__dirname, '..', 'src', 'config', 'migration_add_variant_exercise.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Migración aplicada exitosamente');
    
    // Verificar que la columna existe
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'exercises' AND column_name = 'variant_exercise_id'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Columna variant_exercise_id verificada:', result.rows[0]);
    } else {
      console.log('⚠️ La columna no se encontró en la verificación');
    }
    
  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
