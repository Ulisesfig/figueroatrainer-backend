// Script para hacer sets y reps opcionales en la tabla exercises
// Ejecutar: node scripts/apply-migration-optional-sets-reps.js
// O con URL: node scripts/apply-migration-optional-sets-reps.js "postgresql://..."

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No se encontró DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('railway') || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Aplicando migración: sets y reps opcionales...');

    // Ejecutar cada sentencia por separado
    await client.query('ALTER TABLE exercises ALTER COLUMN sets DROP NOT NULL');
    console.log('✅ sets ahora es nullable');
    
    await client.query('ALTER TABLE exercises ALTER COLUMN reps DROP NOT NULL');
    console.log('✅ reps ahora es nullable');
    
    // Intentar eliminar constraints (pueden no existir con ese nombre exacto)
    try {
      await client.query('ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_sets_check');
      await client.query('ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_reps_check');
      console.log('✅ Constraints anteriores eliminados');
    } catch (e) {
      console.log('⚠️ No se encontraron constraints anteriores (ok)');
    }
    
    // Recrear constraints permitiendo NULL
    await client.query('ALTER TABLE exercises ADD CONSTRAINT exercises_sets_check CHECK (sets IS NULL OR (sets >= 1 AND sets <= 20))');
    await client.query('ALTER TABLE exercises ADD CONSTRAINT exercises_reps_check CHECK (reps IS NULL OR (reps >= 1 AND reps <= 100))');
    console.log('✅ Nuevos constraints agregados');

    // Verificar
    const result = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'exercises' 
      AND column_name IN ('sets', 'reps')
    `);
    console.log('📋 Estado actual:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: nullable = ${row.is_nullable}`);
    });

    console.log('✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
