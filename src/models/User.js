const { query } = require('../config/database');

const User = {
  // Crear un nuevo usuario
  create: async (userData) => {
    const { name, surname, phone, email, username, documentType, password, role = 'user' } = userData;
    const text = `
      INSERT INTO users (name, surname, phone, email, username, document_type, role, password) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, name, surname, phone, email, username, document_type, role, created_at
    `;
    const values = [name, surname, phone, email, username, documentType, role, password];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar usuario por email
  findByEmail: async (email) => {
    const text = 'SELECT * FROM users WHERE email = $1';
    const values = [email];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar usuario por teléfono
  findByPhone: async (phone) => {
    const text = 'SELECT * FROM users WHERE phone = $1';
    const values = [phone];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar usuario por username (documento)
  findByUsername: async (username) => {
    const text = 'SELECT * FROM users WHERE username = $1';
    const values = [username];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar usuario por ID
  findById: async (id) => {
    const text = 'SELECT id, name, surname, phone, email, created_at, updated_at FROM users WHERE id = $1';
    const values = [id];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar usuario
  update: async (id, userData) => {
    const { name, surname, phone } = userData;
    const text = `
      UPDATE users 
      SET name = $1, surname = $2, phone = $3 
      WHERE id = $4 
      RETURNING id, name, surname, phone, email, updated_at
    `;
    const values = [name, surname, phone, id];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Eliminar usuario
  delete: async (id) => {
    const text = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const values = [id];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los usuarios (para admin)
  findAll: async () => {
    const text = 'SELECT id, name, surname, phone, email, created_at FROM users ORDER BY created_at DESC';
    
    try {
      const result = await query(text);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Conteo total de usuarios
  countAll: async () => {
    const text = 'SELECT COUNT(*)::int AS count FROM users';
    const result = await query(text);
    return result.rows[0]?.count || 0;
  },

  // Lista paginada de usuarios (sin password)
  findPaginated: async (page = 1, limit = 50) => {
    const offset = (page - 1) * limit;
    const text = `
      SELECT id, name, surname, email, phone, username, document_type, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const values = [limit, offset];
    const result = await query(text, values);
    return result.rows;
  },

  // Búsqueda por término simple en varios campos
  searchUsers: async (q, limit = 20) => {
    const term = `%${q}%`;
    const text = `
      SELECT id, name, surname, email, phone, username, document_type, role, created_at
      FROM users
      WHERE email ILIKE $1 OR phone ILIKE $1 OR username ILIKE $1 OR name ILIKE $1 OR surname ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const values = [term, limit];
    const result = await query(text, values);
    return result.rows;
  }
};

module.exports = User;
