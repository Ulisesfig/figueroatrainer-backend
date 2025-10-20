const { query } = require('../config/database');

const Plan = {
  // Crear un nuevo plan
  create: async (planData) => {
    const { title, description, content, category = 'training', createdBy } = planData;
    const text = `
      INSERT INTO plans (title, description, content, category, created_by) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, title, description, content, category, created_by, created_at, updated_at
    `;
    const values = [title, description || null, content, category, createdBy || null];
    const result = await query(text, values);
    return result.rows[0];
  },

  // Obtener todos los planes (con paginación opcional)
  findAll: async (page = 1, limit = 50, category = null) => {
    const offset = (page - 1) * limit;
    let text = `
      SELECT p.*, u.name as creator_name, u.surname as creator_surname
      FROM plans p
      LEFT JOIN users u ON p.created_by = u.id
    `;
    const values = [];
    if (category) {
      text += ' WHERE p.category = $1';
      values.push(category);
    }
    text += ' ORDER BY p.created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(limit, offset);
    const result = await query(text, values);
    return result.rows;
  },

  // Contar planes (con filtro opcional por categoría)
  countAll: async (category = null) => {
    let text = 'SELECT COUNT(*)::int AS count FROM plans';
    const values = [];
    if (category) {
      text += ' WHERE category = $1';
      values.push(category);
    }
    const result = await query(text, values);
    return result.rows[0]?.count || 0;
  },

  // Buscar plan por ID
  findById: async (id) => {
    const text = `
      SELECT p.*, u.name as creator_name, u.surname as creator_surname
      FROM plans p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `;
    const result = await query(text, [id]);
    return result.rows[0];
  },

  // Actualizar plan
  update: async (id, planData) => {
    const { title, description, content, category } = planData;
    const text = `
      UPDATE plans 
      SET title = $1, description = $2, content = $3, category = $4
      WHERE id = $5
      RETURNING id, title, description, content, category, created_by, created_at, updated_at
    `;
    const values = [title, description || null, content, category, id];
    const result = await query(text, values);
    return result.rows[0];
  },

  // Eliminar plan
  delete: async (id) => {
    const text = 'DELETE FROM plans WHERE id = $1 RETURNING id';
    const result = await query(text, [id]);
    return result.rows[0];
  },

  // Asignar plan a usuario
  assignToUser: async (userId, planId, status = 'active') => {
    const text = `
      INSERT INTO user_plans (user_id, plan_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, plan_id) 
      DO UPDATE SET status = $3, assigned_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, plan_id, assigned_at, status
    `;
    const result = await query(text, [userId, planId, status]);
    return result.rows[0];
  },

  // Obtener planes asignados a un usuario
  getUserPlans: async (userId) => {
    const text = `
      SELECT up.*, p.title, p.description, p.category, p.content
      FROM user_plans up
      JOIN plans p ON up.plan_id = p.id
      WHERE up.user_id = $1
      ORDER BY up.assigned_at DESC
    `;
    const result = await query(text, [userId]);
    return result.rows;
  },

  // Remover asignación de plan a usuario
  removeFromUser: async (userId, planId) => {
    const text = 'DELETE FROM user_plans WHERE user_id = $1 AND plan_id = $2 RETURNING id';
    const result = await query(text, [userId, planId]);
    return result.rows[0];
  }
};

module.exports = Plan;
