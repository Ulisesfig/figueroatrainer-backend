const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

// Validaciones
const registerValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('surname').trim().notEmpty().withMessage('El apellido es requerido'),
  body('phone').trim().notEmpty().withMessage('El teléfono es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
];

const recoverValidation = [
  body('email').isEmail().withMessage('Email inválido')
];

// Rutas
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/logout', authController.logout);
router.post('/recover', recoverValidation, validate, authController.recover);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
