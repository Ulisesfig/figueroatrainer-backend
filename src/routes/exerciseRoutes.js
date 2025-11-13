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
    body('sets').isInt({ min: 1, max: 20 }).withMessage('Series debe ser entre 1 y 20'),
    body('reps').isInt({ min: 1, max: 100 }).withMessage('Repeticiones debe ser entre 1 y 100'),
    body('notes').optional().isString().trim(),
    body('youtube_url').optional().isURL().withMessage('URL de YouTube inválida')
  ],
  validate,
  exerciseController.create
);

router.get('/', requireAuth, requireAdmin, exerciseController.list);
router.get('/search', requireAuth, requireAdmin, exerciseController.search);
router.get('/:id', requireAuth, requireAdmin, exerciseController.getById);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  [
    body('name').isString().trim().notEmpty().withMessage('Nombre del ejercicio requerido'),
    body('sets').isInt({ min: 1, max: 20 }).withMessage('Series debe ser entre 1 y 20'),
    body('reps').isInt({ min: 1, max: 100 }).withMessage('Repeticiones debe ser entre 1 y 100'),
    body('notes').optional().isString().trim(),
    body('youtube_url').optional().isURL().withMessage('URL de YouTube inválida')
  ],
  validate,
  exerciseController.update
);

router.delete('/:id', requireAuth, requireAdmin, exerciseController.delete);

module.exports = router;
