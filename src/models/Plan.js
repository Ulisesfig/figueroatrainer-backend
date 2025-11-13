const { query } = require('../config/database');

const Plan = {
  // Crear un nuevo plan
  create: async (planData) => {
    const { title, description, content, contentJson = null, category = 'training', createdBy } = planData;
    const text = `
      INSERT INTO plans (title, description, content, content_json, category, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, title, description, content, content_json, category, created_by, created_at, updated_at
    `;
    const values = [title, description || null, content, contentJson, category, createdBy || null];
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
    const { title, description, content, contentJson = null, category } = planData;
    const text = `
      UPDATE plans 
      SET title = $1, description = $2, content = $3, content_json = $4, category = $5
      WHERE id = $6
      RETURNING id, title, description, content, content_json, category, created_by, created_at, updated_at
    `;
    const values = [title, description || null, content, contentJson, category, id];
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
      SELECT up.*, p.title, p.description, p.category, p.content, p.content_json
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
  },

  // Contar cuántos usuarios tienen asignado un plan
  countAssignments: async (planId) => {
    const text = 'SELECT COUNT(*)::int AS count FROM user_plans WHERE plan_id = $1';
    const result = await query(text, [planId]);
    return result.rows[0]?.count || 0;
  },

  // Obtener usuarios asignados a un plan
  getAssignees: async (planId) => {
    const text = `
      SELECT u.id, u.name, u.surname, u.username, u.email
      FROM user_plans up
      JOIN users u ON up.user_id = u.id
      WHERE up.plan_id = $1
      ORDER BY u.name ASC, u.surname ASC
    `;
    const result = await query(text, [planId]);
    return result.rows || [];
  }
};

module.exports = Plan;
