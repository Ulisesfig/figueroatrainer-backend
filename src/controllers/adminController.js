const User = require('../models/User');

const adminController = {
  // Estadísticas básicas
  stats: async (req, res) => {
    try {
      const totalUsers = await User.countAll();
      // Nota: Para activeUsers necesitaríamos un campo de última actividad; placeholder por ahora
      const activeUsers = 0;
      const totalPlans = 0; // Si en el futuro hay planes

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
        { action: 'Usuario registrado', at: new Date().toISOString() },
        { action: 'Login exitoso', at: new Date(Date.now() - 3600_000).toISOString() }
      ];
      res.json({ success: true, items });
    } catch (error) {
      console.error('Error obteniendo actividad:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  }
};

module.exports = adminController;
