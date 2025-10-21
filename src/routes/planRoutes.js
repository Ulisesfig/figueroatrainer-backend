const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Validaciones
const createPlanValidation = [
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('content').trim().notEmpty().withMessage('El contenido es requerido'),
  body('category').optional().isIn(['training', 'nutrition']).withMessage('Categoría inválida')
];

const updatePlanValidation = [
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('content').trim().notEmpty().withMessage('El contenido es requerido'),
  body('category').optional().isIn(['training', 'nutrition']).withMessage('Categoría inválida')
];

// Todas las rutas requieren autenticación y rol admin
router.use(requireAuth, requireAdmin);

// CRUD de planes
router.post('/', createPlanValidation, validate, planController.create);
router.get('/', planController.list);
router.get('/:id', planController.getById);
router.patch('/:id', updatePlanValidation, validate, planController.update);
router.delete('/:id', planController.delete);
router.get('/:id/assignment-count', planController.assignmentCount);
router.get('/:id/assignees', planController.assignees);

// Asignación de planes a usuarios
router.post('/assign/:userId', planController.assignToUser);
router.get('/user/:userId', planController.getUserPlans);
router.delete('/assign/:userId/:planId', planController.removeFromUser);

module.exports = router;
