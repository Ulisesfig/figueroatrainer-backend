const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/stats', requireAuth, requireAdmin, adminController.stats);
router.get('/users', requireAuth, requireAdmin, adminController.listUsers);
router.get('/users/search', requireAuth, requireAdmin, adminController.searchUsers);
router.get('/activity', requireAuth, requireAdmin, adminController.activity);

// Gestión de usuario individual
router.get('/users/:id', requireAuth, requireAdmin, adminController.getUserById);
router.patch(
	'/users/:id',
	requireAuth,
	requireAdmin,
	[
		body('email').optional().isEmail().withMessage('Email inválido'),
		body('phone').optional().matches(/^[0-9 +\-()]{7,20}$/).withMessage('Teléfono inválido'),
		body('document_type').optional().isIn(['dni', 'pasaporte']).withMessage('Tipo de documento inválido'),
		body('username').optional().isString().trim().notEmpty().withMessage('Documento requerido')
	],
	validate,
	adminController.updateUserById
);
router.delete('/users/:id', requireAuth, requireAdmin, adminController.deleteUserById);
router.post('/users/:id/role', requireAuth, requireAdmin, adminController.setUserRole);

// Gestión de pesos de usuarios
router.get('/users/:id/exercises', requireAuth, requireAdmin, adminController.getUserExercises);
router.patch('/users/:id/exercises/:exerciseId', requireAuth, requireAdmin, adminController.updateUserExerciseWeight);
router.delete('/users/:id/exercises/:exerciseId', requireAuth, requireAdmin, adminController.deleteUserExercise);

module.exports = router;
