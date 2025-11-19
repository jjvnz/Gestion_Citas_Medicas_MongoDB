// Authentication Middleware
const passport = require('../config/passport');

// Middleware para verificar JWT
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Error de autenticación',
        message: err.message 
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'No autorizado',
        message: 'Token inválido o expirado' 
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

// Middleware para verificar roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'No autorizado',
        message: 'Usuario no autenticado' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Acceso denegado',
        message: `Se requiere rol: ${roles.join(' o ')}`
      });
    }
    
    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

module.exports = {
  authenticateJWT,
  authorizeRoles,
  optionalAuth
};
