const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y ser admin
router.post(
  '/',
  requireAuth,
  requireAdmin,
  [
    body('name').isString().trim().notEmpty().withMessage('Nombre del ejercicio requerido'),
    body('sets').optional({ nullable: true }).isInt({ min: 1, max: 20 }).withMessage('Series debe ser entre 1 y 20'),
    body('reps').optional({ nullable: true }).isInt({ min: 1, max: 100 }).withMessage('Repeticiones debe ser entre 1 y 100'),
    body('notes').optional().isString().trim(),
    body('youtube_url').optional().isURL().withMessage('URL de YouTube inválida'),
    body('suggested_weight').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Peso debe ser un número positivo')
  ],
  validate,
  exerciseController.create
);

router.get('/', requireAuth, requireAdmin, exerciseController.list);
router.get('/search', requireAuth, requireAdmin, exerciseController.search);
router.get('/:id', requireAuth, requireAdmin, exerciseController.getById);

const updateValidation = [
  body('name').isString().trim().notEmpty().withMessage('Nombre del ejercicio requerido'),
  body('sets').optional({ nullable: true }).isInt({ min: 1, max: 20 }).withMessage('Series debe ser entre 1 y 20'),
  body('reps').optional({ nullable: true }).isInt({ min: 1, max: 100 }).withMessage('Repeticiones debe ser entre 1 y 100'),
  body('notes').optional().isString().trim(),
  body('youtube_url').optional().isURL().withMessage('URL de YouTube inválida'),
  body('suggested_weight').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Peso debe ser un número positivo')
];

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  updateValidation,
  validate,
  exerciseController.update
);

// También soportar PUT para compatibilidad
router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  updateValidation,
  validate,
  exerciseController.update
);

router.delete('/:id', requireAuth, requireAdmin, exerciseController.delete);

module.exports = router;
