const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Script para inicializar la base de datos
const initializeDatabase = async () => {
  try {
    console.log('🔧 Inicializando base de datos...');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../config/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el script SQL
    await query(sql);

    console.log('✅ Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
