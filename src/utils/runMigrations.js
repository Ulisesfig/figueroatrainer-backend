// Script para ejecutar migraciones automáticamente
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

const migrations = [
  'migration_add_exercises.sql',
  'migration_add_plans.sql',
  'migration_add_username.sql',
  'migration_add_role.sql',
  'migration_add_password_resets.sql',
  'migration_add_plan_json.sql',
  'migration_add_last_login.sql',
  'migration_add_user_exercises.sql',
  'migration_add_user_exercise_history.sql',
  'migration_add_category.sql'
];

async function runMigrations() {
  console.log('🔄 Ejecutando migraciones automáticas...');
  
  for (const migration of migrations) {
    try {
      const sqlPath = path.join(__dirname, '..', 'config', migration);
      if (!fs.existsSync(sqlPath)) {
        console.log(`⏭️  Omitiendo ${migration} (no existe en ${sqlPath})`);
        continue;
      }
      
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(`⏳ Ejecutando ${migration}...`);
      await query(sql);
      console.log(`✅ Migración aplicada: ${migration}`);
    } catch (error) {
      // Si es un error de tabla ya existente, ignorar
      if (error.code === '42P07' || error.message.includes('already exists')) {
        console.log(`ℹ️  ${migration} ya existe, omitiendo`);
      } else {
        console.error(`❌ Error en ${migration}:`, error.code, error.message);
      }
    }
  }
  
  console.log('✅ Migraciones completadas');
}

module.exports = { runMigrations };
