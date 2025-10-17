// Middleware global para manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error('Error capturado:', err);

  // Error de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          success: false,
          message: 'El registro ya existe',
          error: 'Duplicate entry'
        });
      case '23503': // foreign_key_violation
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida',
          error: 'Foreign key violation'
        });
      case '22P02': // invalid_text_representation
        return res.status(400).json({
          success: false,
          message: 'Formato de datos inválido',
          error: 'Invalid input'
        });
      default:
        return res.status(500).json({
          success: false,
          message: 'Error de base de datos',
          error: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
        });
    }
  }

  // Error JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFound
};
