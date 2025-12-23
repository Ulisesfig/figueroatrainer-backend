const { query } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migración: agregar columna category a exercises...');
    
    const migrationPath = path.join(__dirname, '../src/config/migration_add_category.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await query(migrationSQL);
    
    console.log('✅ Migración aplicada exitosamente');
    console.log('   - Columna "category" agregada a la tabla exercises');
    console.log('   - Índice idx_exercises_category creado');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al aplicar migración:', error);
    process.exit(1);
  }
}

applyMigration();
