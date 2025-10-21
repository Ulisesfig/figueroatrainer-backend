const jwt = require('jsonwebtoken');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  // Intentar obtener token de cookie primero, luego del header Authorization
  let token = req.cookies.token;
  
  // Fallback: buscar en header Authorization (para móviles con localStorage)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No autorizado. Por favor inicia sesión.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
};

// Middleware para requerir rol admin
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = (req, res, next) => {
  // Intentar obtener token de cookie primero, luego del header Authorization
  let token = req.cookies.token;
  
  // Fallback: buscar en header Authorization
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // No hacer nada, continuar sin usuario
    }
  }
  
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth
};
