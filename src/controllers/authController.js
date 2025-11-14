const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetCode } = require('../utils/mailer');

// Fallback de desarrollo si no hay DB (no se usa en producción)
const resetStore = new Map();

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

  // Solicitar recuperación de contraseña: genera un código temporal
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
      const user = await User.findByEmail(String(email).trim().toLowerCase());
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'No existe un usuario con ese email' 
        });
      }

      // Generar un código de 6 dígitos y expiración de 10 minutos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
      try {
        await PasswordReset.create({ userId: user.id, email: user.email, code, expiresAt });
      } catch (dbErr) {
        console.warn('No se pudo persistir en password_resets, se usará fallback en memoria:', dbErr.message);
        resetStore.set(user.email, { code, expiresAt, verified: false });
      }

      // En un entorno real: enviar email con el código
      // Aquí lo registramos en logs para verificación en desarrollo
      console.log(`[RECOVER] Código para ${user.email}: ${code} (expira en 10 minutos)`);

      const payload = { 
        success: true, 
        message: 'Te enviamos un código de verificación a tu email. Ingrésalo para restablecer tu contraseña.'
      };

      // En desarrollo, devolver el código para facilitar pruebas
      if (process.env.NODE_ENV !== 'production') payload.devCode = code;

      // Enviar email real si está configurado
      try { await sendPasswordResetCode(user.email, code); } catch (e) { console.warn('Mailer error:', e.message); }

      res.json(payload);
    } catch (error) {
      console.error('Error en recuperación:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al recuperar contraseña' 
      });
    }
  },

  // Restablecer contraseña con código o tras verificación previa
  resetPassword: async (req, res) => {
    try {
      const { email, code, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y nueva contraseña son requeridos' });
      }

      const emailNorm = String(email).trim().toLowerCase();
      let verifiedOk = false;
      // Intentar vía DB
      try {
        if (code) {
          const valid = await PasswordReset.findValid(emailNorm, String(code).trim());
          if (!valid) return res.status(400).json({ success: false, message: 'Código inválido o vencido' });
          await PasswordReset.markVerified(emailNorm, String(code).trim());
          verifiedOk = true;
        } else {
          const valid = await PasswordReset.hasVerifiedValid(emailNorm);
          if (valid) verifiedOk = true; else return res.status(400).json({ success: false, message: 'Debés verificar el código antes de restablecer la contraseña' });
        }
      } catch (dbErr) {
        console.warn('Fallo consulta en password_resets, se intenta fallback memoria');
        const entry = resetStore.get(emailNorm);
        if (!entry) return res.status(400).json({ success: false, message: 'Solicitá antes la recuperación' });
        if (Date.now() > entry.expiresAt) { resetStore.delete(emailNorm); return res.status(400).json({ success: false, message: 'El código expiró. Volvé a solicitarlo.' }); }
        if (code) { if (String(code).trim() !== entry.code) return res.status(400).json({ success: false, message: 'Código inválido' }); entry.verified = true; }
        else if (!entry.verified) return res.status(400).json({ success: false, message: 'Debés verificar el código antes de restablecer la contraseña' });
        verifiedOk = true;
      }

      // Actualizar contraseña
      const hashed = await bcrypt.hash(String(password), 10);
      await User.updatePasswordByEmail(emailNorm, hashed);

  // Marcar como usado
  try { await PasswordReset.consumeForEmail(emailNorm); } catch (_) { resetStore.delete(emailNorm); }

      res.json({ success: true, message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' });
    } catch (error) {
      console.error('Error en resetPassword:', error);
      res.status(500).json({ success: false, message: 'Error al restablecer contraseña' });
    }
  },
  // Verificar código (paso previo al reset)
  verifyCode: async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, message: 'Email y código son requeridos' });
      }
      const emailNorm = String(email).trim().toLowerCase();
      try {
        const valid = await PasswordReset.findValid(emailNorm, String(code).trim());
        if (!valid) return res.status(400).json({ success: false, message: 'Código inválido o vencido' });
        await PasswordReset.markVerified(emailNorm, String(code).trim());
        res.json({ success: true, message: 'Código verificado. Ahora podés crear una nueva contraseña.' });
      } catch (dbErr) {
        // Fallback memoria
        const entry = resetStore.get(emailNorm);
        if (!entry) return res.status(400).json({ success: false, message: 'Solicitá antes la recuperación' });
        if (Date.now() > entry.expiresAt) { resetStore.delete(emailNorm); return res.status(400).json({ success: false, message: 'El código expiró. Volvé a solicitarlo.' }); }
        if (String(code).trim() !== entry.code) return res.status(400).json({ success: false, message: 'Código inválido' });
        entry.verified = true;
        resetStore.set(emailNorm, entry);
        res.json({ success: true, message: 'Código verificado. Ahora podés crear una nueva contraseña.' });
      }
    } catch (error) {
      console.error('Error en verifyCode:', error);
      res.status(500).json({ success: false, message: 'Error al verificar código' });
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
