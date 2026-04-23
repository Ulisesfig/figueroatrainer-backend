const express = require('express');
const router = express.Router();
const exerciseWeightsController = require('../controllers/exerciseWeightsController');
const { requireAuth } = require('../middleware/auth');

// Obtener todos los ejercicios del usuario
router.get('/my-exercises', requireAuth, exerciseWeightsController.getMyExercises);

// Obtener estadísticas de evolución por ejercicio del usuario
router.get('/my-exercises/stats', requireAuth, exerciseWeightsController.getMyExerciseStats);

// Obtener historial de un ejercicio del usuario
router.get('/my-exercises/:exerciseId/history', requireAuth, exerciseWeightsController.getMyExerciseHistory);

// Crear o actualizar ejercicio
router.post('/my-exercises', requireAuth, exerciseWeightsController.upsertExercise);

// Actualizar peso de un ejercicio
router.patch('/my-exercises/:exerciseId', requireAuth, exerciseWeightsController.updateWeight);

// Eliminar ultimo peso registrado de un ejercicio
router.post('/my-exercises/:exerciseId/remove-last', requireAuth, exerciseWeightsController.removeLastWeight);

// Eliminar ejercicio
router.delete('/my-exercises/:exerciseId', requireAuth, exerciseWeightsController.deleteExercise);

module.exports = router;
