const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  // Registro de usuario
  register: async (req, res) => {
    try {
  let { name, surname, phone, email, username, documentType, password } = req.body;

      // Validar que todos los campos estén presentes
      if (!name || !surname || !phone || !email || !username || !documentType || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos los campos son requeridos' 
        });
      }

      // Normalizaciones
      documentType = String(documentType).trim().toLowerCase();
      email = String(email).trim().toLowerCase();
      username = String(username).trim();
      phone = String(phone).trim();

      // Validación de tipo de documento
      if (!['dni', 'pasaporte'].includes(documentType)) {
        return res.status(400).json({ success: false, message: 'Tipo de documento inválido' });
      }

      // Validar formato DNI (solo números)
      if (documentType === 'dni' && !/^\d+$/.test(username)) {
        return res.status(400).json({ success: false, message: 'El DNI debe contener solo números', field: 'username' });
      }

      // Pasaporte alfanumérico y en mayúsculas
      if (documentType === 'pasaporte') {
        if (!/^[A-Za-z0-9]+$/.test(username)) {
          return res.status(400).json({ success: false, message: 'El Pasaporte debe contener solo letras y números', field: 'username' });
        }
        username = username.toUpperCase();
      }

      // Verificar si el email ya existe
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ 
          success: false, 
          message: 'Este email ya está registrado',
          field: 'email'
        });
      }

      // Verificar si el teléfono ya existe
      const existingPhone = await User.findByPhone(phone);
      if (existingPhone) {
        return res.status(409).json({ 
          success: false, 
          message: 'Este teléfono ya está registrado',
          field: 'phone'
        });
      }

      // Verificar si el username (documento) ya existe
      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ 
          success: false, 
          message: 'Este documento ya está registrado',
          field: 'username'
        });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const newUser = await User.create({
        name,
        surname,
        phone,
        email,
        username,
        documentType,
        password: hashedPassword
      });

      res.status(201).json({ 
        success: true, 
        message: 'Usuario registrado exitosamente',
        user: {
          id: newUser.id,
          name: newUser.name,
          surname: newUser.surname,
          email: newUser.email,
          phone: newUser.phone,
          username: newUser.username
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      
      // Manejar errores de constraint de PostgreSQL
      if (error.code === '23505') { // Unique violation
        const field = error.constraint?.includes('email') ? 'email' 
                    : error.constraint?.includes('phone') ? 'phone'
                    : error.constraint?.includes('username') ? 'username'
                    : 'field';
        
        const messages = {
          email: 'Este email ya está registrado',
          phone: 'Este teléfono ya está registrado',
          username: 'Este documento ya está registrado'
        };
        
        return res.status(409).json({ 
          success: false, 
          message: messages[field] || 'Este valor ya está registrado',
          field
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Error al registrar usuario',
        error: error.message 
      });
    }
  },

  // Login de usuario
  login: async (req, res) => {
    try {
  const { email, password, remember } = req.body;

      // Validar campos
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email y contraseña son requeridos' 
        });
      }

      // Buscar usuario por email
  const user = await User.findByEmail(String(email).trim().toLowerCase());
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Email o contraseña incorrectos' 
        });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          success: false, 
          message: 'Email o contraseña incorrectos' 
        });
      }

  // Generar JWT
      const token = jwt.sign(
        { 
          id: user.id,
          email: user.email, 
          name: user.name, 
          surname: user.surname, 
          phone: user.phone,
          role: user.role || 'user'
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: remember ? '7d' : '1d' }
      );


      // Configurar cookie cross-domain segura
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction ? true : false,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
      };

      res.cookie('token', token, cookieOptions);

      // Actualizar last_login
      try {
        await require('../config/database').query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
      } catch (e) {
        console.warn('No se pudo actualizar last_login:', e.message);
      }

      res.json({ 
        success: true, 
        message: 'Login exitoso',
        redirectUrl: (user.role === 'admin') ? '/pages/admin.html' : '/pages/dashboard.html',
        token: token, // Enviar token también en JSON para fallback en móviles
        user: {
          id: user.id,
          name: user.name,
          surname: user.surname,
          phone: user.phone,
          email: user.email,
          role: user.role || 'user'
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al iniciar sesión',
        error: error.message 
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
      });
      res.json({ 
        success: true, 
        message: 'Sesión cerrada exitosamente' 
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al cerrar sesión' 
      });
    }
  },

  // Recuperar contraseña (simulado)
  recover: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email requerido' 
        });
      }

      // Verificar si existe el usuario
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'No existe un usuario con ese email' 
        });
      }

      // TODO: Implementar envío de email real
      // Por ahora solo simulamos
      res.json({ 
        success: true, 
        message: 'Te enviamos instrucciones a tu email (simulado)' 
      });
    } catch (error) {
      console.error('Error en recuperación:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al recuperar contraseña' 
      });
    }
  },

  // Obtener usuario actual
  getMe: async (req, res) => {
    try {
      res.json({ 
        success: true, 
        user: req.user 
      });
    } catch (error) {
      console.error('Error en getMe:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener usuario' 
      });
    }
  }
};

module.exports = authController;
