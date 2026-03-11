const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/database');

async function applyPaymentsMigration() {
  try {
    console.log('🔄 Aplicando migración de pagos...');

    const migrationPath = path.join(__dirname, '../src/config/migration_add_payments.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await query(sql);

    console.log('✅ Migración de pagos aplicada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al aplicar migración:', error);
    process.exit(1);
  }
}

applyPaymentsMigration();
