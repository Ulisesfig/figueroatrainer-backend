const { query } = require('../config/database');

const UserExercise = {
  // Obtener todos los ejercicios del usuario
  findByUserId: async (userId) => {
    const text = `
      SELECT id, user_id, exercise_id, exercise_name, weight, created_at, updated_at
      FROM user_exercises
      WHERE user_id = $1
      ORDER BY created_at ASC
    `;
    const res = await query(text, [userId]);
    return res.rows;
  },

  // Guardar o actualizar ejercicio
  upsert: async ({ userId, exerciseId, exerciseName, weight }) => {
    const text = `
      INSERT INTO user_exercises (user_id, exercise_id, exercise_name, weight, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, exercise_id) 
      DO UPDATE SET weight = $4, updated_at = NOW()
      RETURNING id, user_id, exercise_id, exercise_name, weight, updated_at
    `;
    const values = [userId, exerciseId, exerciseName, weight];
    const res = await query(text, values);
    return res.rows[0];
  },

  // Crear nuevo ejercicio
  create: async ({ userId, exerciseId, exerciseName, weight = 0 }) => {
    const text = `
      INSERT INTO user_exercises (user_id, exercise_id, exercise_name, weight)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, exercise_id, exercise_name, weight, created_at, updated_at
    `;
    const values = [userId, exerciseId, exerciseName, weight];
    const res = await query(text, values);
    return res.rows[0];
  },

  // Eliminar ejercicio
  delete: async (userId, exerciseId) => {
    const text = `
      DELETE FROM user_exercises
      WHERE user_id = $1 AND exercise_id = $2
      RETURNING id
    `;
    const res = await query(text, [userId, exerciseId]);
    return res.rows[0];
  },

  // Actualizar peso de un ejercicio
  updateWeight: async (userId, exerciseId, weight) => {
    const text = `
      UPDATE user_exercises
      SET weight = $3, updated_at = NOW()
      WHERE user_id = $1 AND exercise_id = $2
      RETURNING id, user_id, exercise_id, exercise_name, weight, updated_at
    `;
    const res = await query(text, [userId, exerciseId, weight]);
    return res.rows[0];
  }
};

module.exports = UserExercise;
