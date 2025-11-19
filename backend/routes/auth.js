const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        message: 'Username, email y password son requeridos'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido',
        message: 'Por favor proporciona un email válido'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña débil',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user'
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        token,
        expiresIn: JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    if (error.message === 'Usuario o email ya existe') {
      return res.status(409).json({
        success: false,
        error: 'Conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: 'Error al registrar usuario'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        message: 'Username y password son requeridos'
      });
    }

    let user = await User.findByUsername(username);
    if (!user) {
      user = await User.findByEmail(username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Cuenta inactiva',
        message: 'Tu cuenta ha sido desactivada'
      });
    }

    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: 'Error al iniciar sesión'
    });
  }
});

router.get('/me', authenticateJWT, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: 'Error al obtener información del usuario'
    });
  }
});

router.put('/change-password', authenticateJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        message: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña débil',
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const userWithPassword = await User.findByEmail(req.user.email);

    const isValidPassword = await User.validatePassword(currentPassword, userWithPassword.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual es incorrecta'
      });
    }

    await User.update(req.user._id, { password: newPassword });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: 'Error al cambiar contraseña'
    });
  }
});

router.get('/users', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.findAll({ status: 'active' });

    res.json({
      success: true,
      data: {
        users,
        total: users.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: 'Error al obtener usuarios'
    });
  }
});

router.post('/validate-token', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token no proporcionado',
        message: 'No se encontró token en la petición'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        valid: true,
        decoded
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido',
      message: error.message,
      data: {
        valid: false
      }
    });
  }
});

module.exports = router;
