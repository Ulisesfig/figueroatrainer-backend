const User = require('../models/User');
const UserExercise = require('../models/UserExercise');

const adminController = {
  // Estadísticas básicas
  stats: async (req, res) => {
    try {
      const totalUsers = await User.countAll();
      // Usuarios activos en últimos 7 días
      const { query } = require('../config/database');
      const result = await query(`
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE last_login IS NOT NULL
          AND last_login >= NOW() - INTERVAL '7 days'
      `);
      const activeUsers = result.rows[0]?.count || 0;
      const totalPlans = 0; // Placeholder hasta implementar planes

      res.json({ success: true, totalUsers, activeUsers, totalPlans });
    } catch (error) {
      console.error('Error obteniendo stats:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Lista paginada de usuarios
  listUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '50', 10);

      const [users, total] = await Promise.all([
        User.findPaginated(page, limit),
        User.countAll()
      ]);

      res.json({
        success: true,
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error listando usuarios:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Búsqueda por query
  searchUsers: async (req, res) => {
    try {
      const q = (req.query.q || '').trim();
      if (q.length < 2) {
        return res.status(400).json({ success: false, message: 'La búsqueda requiere al menos 2 caracteres' });
      }
      const users = await User.searchUsers(q, 20);
      res.json({ success: true, users });
    } catch (error) {
      console.error('Error buscando usuarios:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Actividad (placeholder)
  activity: async (req, res) => {
    try {
      const items = [
        { action: 'Usuario registrado', timestamp: new Date().toISOString() },
        { action: 'Login exitoso', timestamp: new Date(Date.now() - 3600_000).toISOString() }
      ];
      res.json({ success: true, items });
    } catch (error) {
      console.error('Error obteniendo actividad:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  }
  ,

  // Obtener usuario por ID
  getUserById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      res.json({ success: true, user });
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Actualizar usuario por ID (campos permitidos)
  updateUserById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      const data = req.body || {};
      try {
        const updated = await User.updateAdmin(id, data);
        if (!updated) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        res.json({ success: true, message: 'Usuario actualizado', user: updated });
      } catch (err) {
        if (err.code === 'VALIDATION') {
          return res.status(400).json({ success: false, message: err.message, field: err.field });
        }
        if (err.code === '23505') {
          // Unique violation
          const msg = err.constraint?.includes('email') ? 'Este email ya está registrado'
                    : err.constraint?.includes('phone') ? 'Este teléfono ya está registrado'
                    : err.constraint?.includes('username') ? 'Este documento ya está registrado'
                    : 'Valor duplicado';
          return res.status(409).json({ success: false, message: msg });
        }
        console.error('Error actualizando usuario:', err);
        return res.status(500).json({ success: false, message: 'Error del servidor' });
      }
    } catch (error) {
      console.error('Error en updateUserById:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Eliminar usuario por ID
  deleteUserById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      const deleted = await User.delete(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      res.json({ success: true, message: 'Usuario eliminado', id: deleted.id });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Cambiar rol de usuario
  setUserRole: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { role } = req.body || {};
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      if (!role) {
        return res.status(400).json({ success: false, message: 'Rol requerido' });
      }
      try {
        const updated = await User.setRole(id, role);
        if (!updated) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        res.json({ success: true, message: 'Rol actualizado', user: updated });
      } catch (err) {
        if (err.code === 'VALIDATION') {
          return res.status(400).json({ success: false, message: err.message, field: err.field });
        }
        console.error('Error actualizando rol:', err);
        return res.status(500).json({ success: false, message: 'Error del servidor' });
      }
    } catch (error) {
      console.error('Error en setUserRole:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Obtener ejercicios de un usuario específico
  getUserExercises: async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
      }

      const exercises = await UserExercise.findByUserId(userId);
      res.json({
        success: true,
        exercises: exercises || []
      });
    } catch (error) {
      console.error('Error obteniendo ejercicios del usuario:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Actualizar peso de un ejercicio de un usuario
  updateUserExerciseWeight: async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const exerciseId = req.params.exerciseId;
      const { weight } = req.body;

      if (Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
      }

      if (!exerciseId || weight === undefined) {
        return res.status(400).json({ success: false, message: 'exerciseId y weight son requeridos' });
      }

      const exercise = await UserExercise.updateWeight(userId, exerciseId, parseFloat(weight));

      if (!exercise) {
        return res.status(404).json({ success: false, message: 'Ejercicio no encontrado' });
      }

      res.json({
        success: true,
        exercise,
        message: 'Peso actualizado correctamente'
      });
    } catch (error) {
      console.error('Error actualizando peso:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Eliminar ejercicio de un usuario
  deleteUserExercise: async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const exerciseId = req.params.exerciseId;

      if (Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
      }

      if (!exerciseId) {
        return res.status(400).json({ success: false, message: 'exerciseId requerido' });
      }

      await UserExercise.delete(userId, exerciseId);

      res.json({
        success: true,
        message: 'Ejercicio eliminado correctamente'
      });
    } catch (error) {
      console.error('Error eliminando ejercicio:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  }
};

module.exports = adminController;
