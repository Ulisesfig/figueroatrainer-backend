const { query } = require('../config/database');

const Exercise = {
  // Crear un nuevo ejercicio
  create: async (exerciseData) => {
    const { name, sets, reps, notes, youtube_url, suggested_weight, variant_exercise_id, created_by } = exerciseData;
    const text = `
      INSERT INTO exercises (name, sets, reps, notes, youtube_url, suggested_weight, variant_exercise_id, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, name, sets, reps, notes, youtube_url, suggested_weight, variant_exercise_id, created_by, created_at, updated_at
    `;
    const values = [name, sets, reps, notes || null, youtube_url || null, suggested_weight || null, variant_exercise_id || null, created_by || null];
    const result = await query(text, values);
    return result.rows[0];
  },

  // Obtener todos los ejercicios (con paginación opcional)
  findAll: async (page = 1, limit = 100) => {
    const offset = (page - 1) * limit;
    const text = `
      SELECT e.*, 
             u.name as creator_name, u.surname as creator_surname,
             v.id as variant_id, v.name as variant_name, v.sets as variant_sets, v.reps as variant_reps,
             v.notes as variant_notes, v.youtube_url as variant_youtube_url, v.suggested_weight as variant_suggested_weight
      FROM exercises e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN exercises v ON e.variant_exercise_id = v.id
      ORDER BY e.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await query(text, [limit, offset]);
    return result.rows;
  },

  // Contar ejercicios
  countAll: async () => {
    const text = 'SELECT COUNT(*)::int AS count FROM exercises';
    const result = await query(text);
    return result.rows[0]?.count || 0;
  },

  // Buscar ejercicio por ID
  findById: async (id) => {
    const text = `
      SELECT e.*, 
             u.name as creator_name, u.surname as creator_surname,
             v.id as variant_id, v.name as variant_name, v.sets as variant_sets, v.reps as variant_reps,
             v.notes as variant_notes, v.youtube_url as variant_youtube_url, v.suggested_weight as variant_suggested_weight
      FROM exercises e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN exercises v ON e.variant_exercise_id = v.id
      WHERE e.id = $1
    `;
    const result = await query(text, [id]);
    return result.rows[0];
  },

  // Buscar ejercicios por nombre (búsqueda parcial)
  searchByName: async (searchTerm) => {
    const text = `
      SELECT e.*, u.name as creator_name, u.surname as creator_surname
      FROM exercises e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE LOWER(e.name) LIKE LOWER($1)
      ORDER BY e.name
      LIMIT 50
    `;
    const result = await query(text, [`%${searchTerm}%`]);
    return result.rows;
  },

  // Actualizar ejercicio
  update: async (id, exerciseData) => {
    const { name, sets, reps, notes, youtube_url, suggested_weight, variant_exercise_id } = exerciseData;
    const text = `
      UPDATE exercises 
      SET name = $1, sets = $2, reps = $3, notes = $4, youtube_url = $5, suggested_weight = $6, variant_exercise_id = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, name, sets, reps, notes, youtube_url, suggested_weight, variant_exercise_id, created_by, created_at, updated_at
    `;
    const values = [name, sets, reps, notes || null, youtube_url || null, suggested_weight || null, variant_exercise_id || null, id];
    const result = await query(text, values);
    return result.rows[0];
  },

  // Eliminar ejercicio
  delete: async (id) => {
    const text = 'DELETE FROM exercises WHERE id = $1 RETURNING id';
    const result = await query(text, [id]);
    return result.rows[0];
  }
};

module.exports = Exercise;
