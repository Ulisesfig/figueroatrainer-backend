const UserExercise = require('../models/UserExercise');

const exerciseController = {
  // Obtener todos los ejercicios del usuario autenticado
  getMyExercises: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const exercises = await UserExercise.findByUserId(userId);
      res.json({
        success: true,
        exercises: exercises || []
      });
    } catch (error) {
      console.error('Error al obtener ejercicios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ejercicios',
        error: error.message
      });
    }
  },

  // Crear o actualizar ejercicio
  upsertExercise: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      // Soportar tanto camelCase como snake_case desde el frontend
      const { exerciseId, exerciseName, exercise_id, exercise_name, weight } = req.body;
      const finalExerciseId = exerciseId || exercise_id;
      const finalExerciseName = exerciseName || exercise_name;
      
      if (!finalExerciseId || !finalExerciseName) {
        return res.status(400).json({
          success: false,
          message: 'exerciseId y exerciseName son requeridos'
        });
      }

      const exercise = await UserExercise.upsert({
        userId,
        exerciseId: String(finalExerciseId).trim(),
        exerciseName: String(finalExerciseName).trim(),
        weight: parseFloat(weight) || 0
      });

      res.json({
        success: true,
        exercise,
        message: 'Ejercicio guardado'
      });
    } catch (error) {
      console.error('Error al guardar ejercicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error al guardar ejercicio',
        error: error.message
      });
    }
  },

  // Eliminar ejercicio
  deleteExercise: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { exerciseId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      if (!exerciseId) {
        return res.status(400).json({ success: false, message: 'exerciseId requerido' });
      }

      await UserExercise.delete(userId, exerciseId);

      res.json({
        success: true,
        message: 'Ejercicio eliminado'
      });
    } catch (error) {
      console.error('Error al eliminar ejercicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar ejercicio',
        error: error.message
      });
    }
  },

  // Actualizar peso de un ejercicio
  updateWeight: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { exerciseId } = req.params;
      const { weight } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      if (!exerciseId || weight === undefined) {
        return res.status(400).json({
          success: false,
          message: 'exerciseId y weight son requeridos'
        });
      }

      const exercise = await UserExercise.updateWeight(userId, exerciseId, parseFloat(weight));

      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: 'Ejercicio no encontrado'
        });
      }

      res.json({
        success: true,
        exercise,
        message: 'Peso actualizado'
      });
    } catch (error) {
      console.error('Error al actualizar peso:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar peso',
        error: error.message
      });
    }
  }
};

module.exports = exerciseController;
