const { query } = require('../config/database');

const Contact = {
  // Crear un nuevo mensaje de contacto
  create: async (contactData) => {
    const { name, email, message } = contactData;
    const text = `
      INSERT INTO contacts (name, email, message) 
      VALUES ($1, $2, $3) 
      RETURNING id, name, email, message, created_at
    `;
    const values = [name, email, message];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los mensajes de contacto
  findAll: async (limit = 100) => {
    const text = 'SELECT * FROM contacts ORDER BY created_at DESC LIMIT $1';
    const values = [limit];
    
    try {
      const result = await query(text, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Buscar por ID
  findById: async (id) => {
    const text = 'SELECT * FROM contacts WHERE id = $1';
    const values = [id];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Eliminar mensaje
  delete: async (id) => {
    const text = 'DELETE FROM contacts WHERE id = $1 RETURNING id';
    const values = [id];
    
    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Contact;
