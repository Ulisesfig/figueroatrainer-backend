const { query } = require('../config/database');

const UserExercise = {
  // Obtener todos los ejercicios del usuario
  findByUserId: async (userId) => {
    // Intentar con las nuevas columnas, si falla usar las antiguas
    try {
      const text = `
        SELECT id, user_id, exercise_id, exercise_name, weight, 
               COALESCE(previous_weight, NULL) as previous_weight, 
               COALESCE(weight_updated_at, updated_at) as weight_updated_at, 
               created_at, updated_at
        FROM user_exercises
        WHERE user_id = $1
        ORDER BY created_at ASC
      `;
      const res = await query(text, [userId]);
      return res.rows;
    } catch (error) {
      // Fallback si las columnas no existen
      const text = `
        SELECT id, user_id, exercise_id, exercise_name, weight, created_at, updated_at
        FROM user_exercises
        WHERE user_id = $1
        ORDER BY created_at ASC
      `;
      const res = await query(text, [userId]);
      return res.rows.map(row => ({
        ...row,
        previous_weight: null,
        weight_updated_at: row.updated_at
      }));
    }
  },

  // Guardar o actualizar ejercicio
  upsert: async ({ userId, exerciseId, exerciseName, weight }) => {
    try {
      const text = `
        INSERT INTO user_exercises (user_id, exercise_id, exercise_name, weight, weight_updated_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (user_id, exercise_id) 
        DO UPDATE SET 
          previous_weight = user_exercises.weight,
          weight = $4, 
          weight_updated_at = NOW(),
          updated_at = NOW()
        RETURNING *
      `;
      const values = [userId, exerciseId, exerciseName, weight];
      const res = await query(text, values);
      return res.rows[0];
    } catch (error) {
      // Fallback sin las nuevas columnas
      const text = `
        INSERT INTO user_exercises (user_id, exercise_id, exercise_name, weight, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, exercise_id) 
        DO UPDATE SET weight = $4, updated_at = NOW()
        RETURNING *
      `;
      const values = [userId, exerciseId, exerciseName, weight];
      const res = await query(text, values);
      return res.rows[0];
    }
  },

  // Crear nuevo ejercicio
  create: async ({ userId, exerciseId, exerciseName, weight = 0 }) => {
    try {
      const text = `
        INSERT INTO user_exercises (user_id, exercise_id, exercise_name, weight, weight_updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      const values = [userId, exerciseId, exerciseName, weight];
      const res = await query(text, values);
      return res.rows[0];
    } catch (error) {
      const text = `
        INSERT INTO user_exercises (user_id, exercise_id, exercise_name, weight)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [userId, exerciseId, exerciseName, weight];
      const res = await query(text, values);
      return res.rows[0];
    }
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

  // Actualizar peso de un ejercicio (guarda el peso anterior)
  updateWeight: async (userId, exerciseId, weight) => {
    try {
      const text = `
        UPDATE user_exercises
        SET previous_weight = weight,
            weight = $3, 
            weight_updated_at = NOW(),
            updated_at = NOW()
        WHERE user_id = $1 AND exercise_id = $2
        RETURNING *
      `;
      const res = await query(text, [userId, exerciseId, weight]);
      return res.rows[0];
    } catch (error) {
      const text = `
        UPDATE user_exercises
        SET weight = $3, updated_at = NOW()
        WHERE user_id = $1 AND exercise_id = $2
        RETURNING *
      `;
      const res = await query(text, [userId, exerciseId, weight]);
      return res.rows[0];
    }
  }
};

module.exports = UserExercise;
