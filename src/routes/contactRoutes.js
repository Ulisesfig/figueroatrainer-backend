const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

// Validaciones
const contactValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('message').trim().notEmpty().withMessage('El mensaje es requerido')
    .isLength({ min: 10 }).withMessage('El mensaje debe tener al menos 10 caracteres')
];

// Ruta pública para enviar mensajes
router.post('/', contactValidation, validate, contactController.createContact);

// Rutas protegidas (solo admin)
router.get('/', requireAuth, contactController.getAllContacts);
router.get('/:id', requireAuth, contactController.getContactById);
router.delete('/:id', requireAuth, contactController.deleteContact);

module.exports = router;
