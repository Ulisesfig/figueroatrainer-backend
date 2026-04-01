const UserExercise = require('../models/UserExercise');
const Plan = require('../models/Plan');

function normalizeExerciseIdFromName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function registerAllowedExercise(allowedMap, rawItem) {
  if (!rawItem) return;

  if (typeof rawItem === 'string') {
    const cleanName = rawItem.replace(/^[-*\d.\s]+/, '').trim();
    if (!cleanName || /^sin ejercicios$/i.test(cleanName)) return;
    const generatedId = normalizeExerciseIdFromName(cleanName);
    if (!generatedId || allowedMap.has(generatedId)) return;
    allowedMap.set(generatedId, cleanName);
    return;
  }

  if (typeof rawItem !== 'object') return;

  const name = String(rawItem.name || rawItem.title || '').trim();
  if (!name) return;

  const rawId = rawItem.id || rawItem.exercise_id || rawItem.exerciseId || '';
  const finalId = String(rawId || normalizeExerciseIdFromName(name)).trim();
  if (!finalId || allowedMap.has(finalId)) return;
  allowedMap.set(finalId, name);
}

function collectAllowedFromPlanText(planContent, allowedMap) {
  const lines = String(planContent || '').split(/\r?\n/);
  lines.forEach((line) => {
    const clean = line.trim();
    if (!clean) return;
    if (/^D[ií]a\s+\d+\s*:/i.test(clean)) return;
    if (/^(Calentamiento|Movilidad)(\s+General)?\s*:/i.test(clean)) return;

    const structuredName = clean.match(/name=([^|]+)/i);
    const structuredId = clean.match(/\[#ID=([^\]]+)\]/i);
    if (structuredName) {
      registerAllowedExercise(allowedMap, {
        id: structuredId ? structuredId[1].trim() : '',
        name: structuredName[1].trim()
      });
      return;
    }

    if (/^[-*\d.\s]+/.test(clean)) {
      registerAllowedExercise(allowedMap, clean);
    }
  });
}

async function getAllowedExercisesByUser(userId) {
  const plans = await Plan.getUserPlans(userId);
  const trainingPlans = (plans || []).filter(plan => plan && plan.category === 'training');
  const allowedMap = new Map();

  trainingPlans.forEach((plan) => {
    const contentJson = plan && typeof plan.content_json === 'object' ? plan.content_json : null;

    if (contentJson) {
      const general = contentJson.general || {};
      (general.warmup || []).forEach(item => registerAllowedExercise(allowedMap, item));
      (general.mobility || []).forEach(item => registerAllowedExercise(allowedMap, item));

      (contentJson.days || []).forEach((day) => {
        (day.exercises || []).forEach(item => registerAllowedExercise(allowedMap, item));
        (day.warmup || day.calentamiento || []).forEach(item => registerAllowedExercise(allowedMap, item));
        (day.mobility || day.movilidad || []).forEach(item => registerAllowedExercise(allowedMap, item));
      });
    }

    if (plan && plan.content) {
      collectAllowedFromPlanText(plan.content, allowedMap);
    }
  });

  return allowedMap;
}

const exerciseController = {
  // Obtener estadísticas de evolución de pesos del usuario autenticado
  getMyExerciseStats: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const limit = parseInt(req.query.historyLimit || req.query.limit || '12', 10);
      const stats = await UserExercise.getStatsByUser(userId, limit);

      res.json({
        success: true,
        stats: stats || []
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de pesos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de pesos',
        error: error.message
      });
    }
  },

  // Obtener historial de un ejercicio del usuario autenticado
  getMyExerciseHistory: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { exerciseId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      if (!exerciseId) {
        return res.status(400).json({ success: false, message: 'exerciseId requerido' });
      }

      const limit = parseInt(req.query.limit || '30', 10);
      const history = await UserExercise.getHistory(userId, exerciseId, limit);

      res.json({
        success: true,
        history: history || []
      });
    } catch (error) {
      console.error('Error al obtener historial de peso:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de peso',
        error: error.message
      });
    }
  },

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
      const { exerciseId, exerciseName, exercise_id, exercise_name, weight, reps } = req.body;
      const finalExerciseId = exerciseId || exercise_id;
      const finalExerciseName = exerciseName || exercise_name;
      
      if (!finalExerciseId || !finalExerciseName) {
        return res.status(400).json({
          success: false,
          message: 'exerciseId y exerciseName son requeridos'
        });
      }

      const allowedExercises = await getAllowedExercisesByUser(userId);
      if (allowedExercises.size === 0) {
        return res.status(400).json({
          success: false,
          message: 'No tienes ejercicios de entrenamiento cargados para registrar pesos'
        });
      }

      const normalizedExerciseId = String(finalExerciseId).trim();
      if (!allowedExercises.has(normalizedExerciseId)) {
        return res.status(400).json({
          success: false,
          message: 'Solo puedes registrar pesos en ejercicios de tu rutina asignada'
        });
      }

      const canonicalExerciseName = allowedExercises.get(normalizedExerciseId) || String(finalExerciseName).trim();

      const exercise = await UserExercise.upsert({
        userId,
        exerciseId: normalizedExerciseId,
        exerciseName: canonicalExerciseName,
        weight: parseFloat(weight) || 0,
        reps
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
      const { weight, reps } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      if (!exerciseId || weight === undefined) {
        return res.status(400).json({
          success: false,
          message: 'exerciseId y weight son requeridos'
        });
      }

      const exercise = await UserExercise.updateWeight(userId, exerciseId, parseFloat(weight), reps);

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
