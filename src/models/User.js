const { query } = require('../config/database');

const User = {
  // Crear un nuevo usuario
  create: async (userData) => {
    const { name, surname, phone, email, username, documentType, password } = userData;
    const text = `
      INSERT INTO users (name, surname, phone, email, username, document_type, password) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id, name, surname, phone, email, username, document_type, created_at
    `;
    const values = [name, surname, phone, email, username, documentType, password];
    
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
  }
};

module.exports = User;
