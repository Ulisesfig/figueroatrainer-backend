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

  // Buscar usuario por ID (sin password) - extendido para admin/profile
  findById: async (id) => {
    const text = `
      SELECT id, name, surname, phone, email, username, document_type, role, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
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
  },

  // Actualización arbitraria de campos permitidos para admin
  updateAdmin: async (id, data) => {
    const allowed = ['name', 'surname', 'phone', 'email', 'username', 'document_type'];
    const entries = Object.entries(data).filter(([k, v]) => allowed.includes(k));
    if (entries.length === 0) {
      return await User.findById(id);
    }

    // Validaciones simples
    const payload = Object.fromEntries(entries);
    if (payload.document_type) {
      const dt = String(payload.document_type).toLowerCase();
      if (!['dni', 'pasaporte'].includes(dt)) {
        const err = new Error('Tipo de documento inválido');
        err.code = 'VALIDATION';
        err.field = 'document_type';
        throw err;
      }
      payload.document_type = dt;
      if (dt === 'dni' && payload.username && !/^\d+$/.test(String(payload.username))) {
        const err = new Error('El DNI debe contener solo números');
        err.code = 'VALIDATION';
        err.field = 'username';
        throw err;
      }
      if (dt === 'pasaporte' && payload.username) {
        if (!/^[A-Za-z0-9]+$/.test(String(payload.username))) {
          const err = new Error('El Pasaporte debe contener solo letras y números');
          err.code = 'VALIDATION';
          err.field = 'username';
          throw err;
        }
        payload.username = String(payload.username).toUpperCase();
      }
    }

    const setClauses = entries.map(([key], idx) => `${key} = $${idx + 1}`);
    const values = entries.map(([_, val]) => val);
    values.push(id);

    const text = `
      UPDATE users 
      SET ${setClauses.join(', ')}
      WHERE id = $${entries.length + 1}
      RETURNING id, name, surname, phone, email, username, document_type, role, created_at, updated_at
    `;
    const result = await query(text, values);
    return result.rows[0];
  },

  // Cambiar rol de usuario
  setRole: async (id, role) => {
    const r = String(role).toLowerCase();
    if (!['user', 'admin'].includes(r)) {
      const err = new Error('Rol inválido');
      err.code = 'VALIDATION';
      err.field = 'role';
      throw err;
    }
    const text = `
      UPDATE users SET role = $1 WHERE id = $2 
      RETURNING id, name, surname, phone, email, username, document_type, role, created_at, updated_at
    `;
    const values = [r, id];
    const result = await query(text, values);
    return result.rows[0];
  },

  // Actualizar contraseña por email
  updatePasswordByEmail: async (email, hashedPassword) => {
    const text = `
      UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING id
    `;
    const values = [hashedPassword, email];
    const result = await query(text, values);
    return result.rows[0];
  }
};

module.exports = User;
