// Script para resetear la base de datos en Railway
// Uso: railway run node reset-db.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Conectando a la base de datos de Railway...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'src', 'config', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🗑️  Eliminando tablas existentes...');
    console.log('📝 Creando tablas nuevas con campos actualizados...');
    
    // Ejecutar el script SQL
    await pool.query(sql);
    
    console.log('\n✅ ¡Base de datos reseteada exitosamente!');
    console.log('✅ Tablas creadas:');
    console.log('   - users (con username y document_type)');
    console.log('   - contacts');
    console.log('\n📊 Verificando estructura de la tabla users...\n');
    
    // Verificar la estructura
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.table(result.rows);
    
    // Verificar constraints únicos
    console.log('\n🔒 Constraints UNIQUE verificados:');
    const constraints = await pool.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass 
      AND contype = 'u';
    `);
    
    constraints.rows.forEach(c => {
      console.log(`   ✓ ${c.conname}`);
    });
    
    console.log('\n🎉 Tu base de datos está lista para recibir registros!\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al resetear base de datos:');
    console.error(error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

resetDatabase();
