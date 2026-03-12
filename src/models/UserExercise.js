const { query } = require('../config/database');

const UserExercise = {
  // Registrar evento de peso en historial (si la tabla existe)
  recordHistory: async ({ userId, exerciseId, exerciseName, weight, source = 'manual' }) => {
    if (!userId || !exerciseId || weight === undefined || weight === null) return null;

    const numericWeight = parseFloat(weight);
    if (!Number.isFinite(numericWeight) || numericWeight < 0) return null;

    try {
      const text = `
        INSERT INTO user_exercise_history (user_id, exercise_id, exercise_name, weight, source)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, exercise_id, exercise_name, weight, source, recorded_at
      `;
      const values = [userId, String(exerciseId), exerciseName || String(exerciseId), numericWeight, source];
      const res = await query(text, values);
      return res.rows[0];
    } catch (_error) {
      // Compatibilidad: si la tabla aún no existe, no bloquear flujo principal.
      return null;
    }
  },

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
    const numericWeight = parseFloat(weight) || 0;

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
      const values = [userId, exerciseId, exerciseName, numericWeight];
      const res = await query(text, values);
      await UserExercise.recordHistory({
        userId,
        exerciseId,
        exerciseName,
        weight: numericWeight,
        source: 'upsert'
      });
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
      const values = [userId, exerciseId, exerciseName, numericWeight];
      const res = await query(text, values);
      await UserExercise.recordHistory({
        userId,
        exerciseId,
        exerciseName,
        weight: numericWeight,
        source: 'upsert-fallback'
      });
      return res.rows[0];
    }
  },

  // Crear nuevo ejercicio
  create: async ({ userId, exerciseId, exerciseName, weight = 0 }) => {
    const numericWeight = parseFloat(weight) || 0;

    try {
      const text = `
        INSERT INTO user_exercises (user_id, exercise_id, exercise_name, weight, weight_updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      const values = [userId, exerciseId, exerciseName, numericWeight];
      const res = await query(text, values);
      await UserExercise.recordHistory({
        userId,
        exerciseId,
        exerciseName,
        weight: numericWeight,
        source: 'create'
      });
      return res.rows[0];
    } catch (error) {
      const text = `
        INSERT INTO user_exercises (user_id, exercise_id, exercise_name, weight)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [userId, exerciseId, exerciseName, numericWeight];
      const res = await query(text, values);
      await UserExercise.recordHistory({
        userId,
        exerciseId,
        exerciseName,
        weight: numericWeight,
        source: 'create-fallback'
      });
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
    const numericWeight = parseFloat(weight);

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
      const res = await query(text, [userId, exerciseId, numericWeight]);
      const row = res.rows[0];
      if (row) {
        await UserExercise.recordHistory({
          userId,
          exerciseId,
          exerciseName: row.exercise_name,
          weight: numericWeight,
          source: 'update'
        });
      }
      return row;
    } catch (error) {
      const text = `
        UPDATE user_exercises
        SET weight = $3, updated_at = NOW()
        WHERE user_id = $1 AND exercise_id = $2
        RETURNING *
      `;
      const res = await query(text, [userId, exerciseId, numericWeight]);
      const row = res.rows[0];
      if (row) {
        await UserExercise.recordHistory({
          userId,
          exerciseId,
          exerciseName: row.exercise_name,
          weight: numericWeight,
          source: 'update-fallback'
        });
      }
      return row;
    }
  },

  // Historial de un ejercicio para un usuario
  getHistory: async (userId, exerciseId, limit = 30) => {
    const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 30;

    try {
      const text = `
        SELECT id, user_id, exercise_id, exercise_name, weight, source, recorded_at
        FROM user_exercise_history
        WHERE user_id = $1 AND exercise_id = $2
        ORDER BY recorded_at DESC
        LIMIT $3
      `;
      const res = await query(text, [userId, String(exerciseId), safeLimit]);
      return res.rows || [];
    } catch (_error) {
      return [];
    }
  },

  // Estadísticas de evolución por ejercicio para un usuario
  getStatsByUser: async (userId, historyLimit = 12) => {
    const safeHistoryLimit = Number.isFinite(Number(historyLimit))
      ? Math.max(1, Math.min(60, Number(historyLimit)))
      : 12;

    try {
      const text = `
        WITH base AS (
          SELECT
            exercise_id,
            MAX(exercise_name) AS exercise_name,
            COUNT(*)::int AS points,
            MIN(weight)::numeric(10,2) AS min_weight,
            MAX(weight)::numeric(10,2) AS max_weight,
            ROUND(AVG(weight)::numeric, 2) AS avg_weight,
            (ARRAY_AGG(weight ORDER BY recorded_at ASC))[1] AS first_weight,
            (ARRAY_AGG(weight ORDER BY recorded_at DESC))[1] AS last_weight,
            (ARRAY_AGG(recorded_at ORDER BY recorded_at DESC))[1] AS last_recorded_at
          FROM user_exercise_history
          WHERE user_id = $1
          GROUP BY exercise_id
        )
        SELECT
          b.exercise_id,
          b.exercise_name,
          b.points,
          b.min_weight,
          b.max_weight,
          b.avg_weight,
          b.first_weight,
          b.last_weight,
          b.last_recorded_at,
          ROUND((b.last_weight - b.first_weight)::numeric, 2) AS delta_weight,
          CASE
            WHEN b.first_weight > 0
              THEN ROUND((((b.last_weight - b.first_weight) / b.first_weight) * 100)::numeric, 2)
            ELSE NULL
          END AS delta_percent,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'weight', h.weight,
                  'recorded_at', h.recorded_at,
                  'source', h.source
                )
                ORDER BY h.recorded_at DESC
              )
              FROM (
                SELECT weight, recorded_at, source
                FROM user_exercise_history
                WHERE user_id = $1 AND exercise_id = b.exercise_id
                ORDER BY recorded_at DESC
                LIMIT $2
              ) h
            ),
            '[]'::json
          ) AS history
        FROM base b
        ORDER BY b.exercise_name ASC
      `;

      const res = await query(text, [userId, safeHistoryLimit]);
      return res.rows || [];
    } catch (_error) {
      // Fallback simple cuando no existe tabla de historial.
      const rows = await UserExercise.findByUserId(userId);
      return rows.map((row) => {
        const current = row.weight || 0;
        const previous = row.previous_weight;
        const first = previous !== null && previous !== undefined ? previous : current;
        return {
          exercise_id: row.exercise_id,
          exercise_name: row.exercise_name,
          points: previous !== null && previous !== undefined ? 2 : 1,
          min_weight: previous !== null && previous !== undefined ? Math.min(previous, current) : current,
          max_weight: previous !== null && previous !== undefined ? Math.max(previous, current) : current,
          avg_weight: previous !== null && previous !== undefined ? Number(((previous + current) / 2).toFixed(2)) : current,
          first_weight: first,
          last_weight: current,
          last_recorded_at: row.weight_updated_at || row.updated_at || row.created_at,
          delta_weight: Number((current - first).toFixed(2)),
          delta_percent: first > 0 ? Number((((current - first) / first) * 100).toFixed(2)) : null,
          history: [
            {
              weight: current,
              recorded_at: row.weight_updated_at || row.updated_at || row.created_at,
              source: 'current'
            }
          ]
        };
      });
    }
  }
};

module.exports = UserExercise;
