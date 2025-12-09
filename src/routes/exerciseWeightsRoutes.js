const express = require('express');
const router = express.Router();
const exerciseWeightsController = require('../controllers/exerciseWeightsController');
const { requireAuth } = require('../middleware/auth');

// Obtener todos los ejercicios del usuario
router.get('/my-exercises', requireAuth, exerciseWeightsController.getMyExercises);

// Crear o actualizar ejercicio
router.post('/my-exercises', requireAuth, exerciseWeightsController.upsertExercise);

// Actualizar peso de un ejercicio
router.patch('/my-exercises/:exerciseId', requireAuth, exerciseWeightsController.updateWeight);

// Eliminar ejercicio
router.delete('/my-exercises/:exerciseId', requireAuth, exerciseWeightsController.deleteExercise);

module.exports = router;
