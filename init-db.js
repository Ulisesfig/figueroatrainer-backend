require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔧 Conectando a la base de datos...');
    
    const sqlPath = path.join(__dirname, 'src', 'config', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Ejecutando script SQL...');
    await pool.query(sql);
    
    console.log('✅ Base de datos inicializada correctamente!');
    console.log('✅ Tablas creadas: users, contacts');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
