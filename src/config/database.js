const { Pool } = require('pg');

// Solo cargar .env si existe (desarrollo local)
try {
  if (!process.env.RAILWAY_ENVIRONMENT) {
    require('dotenv').config();
  }
} catch (err) {
  // Ignorar error si dotenv no está disponible
}

// Configuración de PostgreSQL para Railway
// Railway inyecta DATABASE_PUBLIC_URL automáticamente
const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERROR: No se encontró DATABASE_URL o DATABASE_PUBLIC_URL');
  process.exit(1);
}

console.log('🔌 Conectando a base de datos...');
console.log('📍 Connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Ocultar password

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Evento para capturar errores de conexión
pool.on('error', (err, client) => {
  console.error('Error inesperado en cliente de PostgreSQL:', err);
  process.exit(-1);
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    const result = await client.query('SELECT NOW()');
    console.log('⏰ Hora del servidor DB:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
    return false;
  }
};

// Función para ejecutar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};
