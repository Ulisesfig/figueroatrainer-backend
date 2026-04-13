const { query } = require('../src/config/database');

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migracion: agregar columna topic a contacts...');

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'contacts' AND column_name = 'topic'
        ) THEN
          ALTER TABLE contacts ADD COLUMN topic VARCHAR(50) NOT NULL DEFAULT 'otro';
        END IF;
      END $$;
    `);

    await query('CREATE INDEX IF NOT EXISTS idx_contacts_topic ON contacts(topic);');

    console.log('✅ Migracion aplicada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al aplicar migracion:', error.message);
    process.exit(1);
  }
}

applyMigration();
