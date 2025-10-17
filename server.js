// Solo cargar .env si NO estamos en Railway
try {
  if (!process.env.RAILWAY_ENVIRONMENT) {
    require('dotenv').config();
  }
} catch (err) {
  // Ignorar si dotenv no está disponible
}

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

// Importar configuración de base de datos
const { testConnection } = require('./src/config/database');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const contactRoutes = require('./src/routes/contactRoutes');

// Importar middleware
const { requireAuth } = require('./src/middleware/auth');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

// Seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para desarrollo
  crossOriginEmbedderPolicy: false
}));

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true
};
app.use(cors(corsOptions));

// Middleware de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);

// Proteger dashboard (solo usuarios logueados)
app.get('/pages/dashboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/dashboard.html'));
});

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  Servidor iniciado sin conexión a la base de datos');
    }

    app.listen(port, () => {
      console.log(`
╔════════════════════════════════════════════╗
║     🏋️  Figueroa Trainer Backend          ║
╠════════════════════════════════════════════╣
║  🚀 Servidor: http://localhost:${port}      ║
║  📦 Entorno: ${process.env.NODE_ENV || 'development'}              ║
║  💾 DB: ${dbConnected ? 'Conectada ✅' : 'Desconectada ❌'}         ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
