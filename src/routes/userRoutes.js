const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

// Validaciones
const updateProfileValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('surname').trim().notEmpty().withMessage('El apellido es requerido'),
  body('phone').trim().notEmpty().withMessage('El teléfono es requerido')
];

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Rutas
router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidation, validate, userController.updateProfile);
router.delete('/account', userController.deleteAccount);

// Ruta para admin (TODO: agregar middleware de admin)
router.get('/all', userController.getAllUsers);

module.exports = router;
