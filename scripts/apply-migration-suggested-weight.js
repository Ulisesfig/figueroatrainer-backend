// Script para agregar campo suggested_weight a la tabla exercises
// Ejecutar: node scripts/apply-migration-suggested-weight.js
// O con URL directa: node scripts/apply-migration-suggested-weight.js "postgresql://..."

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Permitir pasar la DATABASE_URL como argumento
const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No se encontró DATABASE_URL. Proporciona la URL como argumento o en el archivo .env');
  console.log('Uso: node scripts/apply-migration-suggested-weight.js "postgresql://usuario:password@host:puerto/database"');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('railway') || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Aplicando migración: suggested_weight en exercises...');

    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, '../src/config/migration_add_suggested_weight_exercises.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Ejecutar la migración
    const result = await client.query(sql);

    console.log('✅ Migración aplicada exitosamente');
    console.log('📊 Resultado:', result);

    // Verificar la estructura
    const verification = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'exercises' 
      ORDER BY ordinal_position
    `);
    console.log('📋 Estructura actual de exercises:');
    verification.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'null'})`);
    });

  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
