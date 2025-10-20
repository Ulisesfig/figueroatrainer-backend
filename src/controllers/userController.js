const User = require('../models/User');

const userController = {
  // Obtener perfil de usuario
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      res.json({ 
        success: true, 
        user 
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener perfil de usuario' 
      });
    }
  },

  // Actualizar perfil de usuario
  updateProfile: async (req, res) => {
    try {
      const { name, surname, phone } = req.body;

      // Validar campos
      if (!name || !surname || !phone) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos los campos son requeridos' 
        });
      }

      // Actualizar usuario
      const updatedUser = await User.update(req.user.id, {
        name,
        surname,
        phone
      });

      if (!updatedUser) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Perfil actualizado exitosamente',
        user: updatedUser 
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar perfil' 
      });
    }
  },

  // Eliminar cuenta de usuario
  deleteAccount: async (req, res) => {
    try {
      const deletedUser = await User.delete(req.user.id);

      if (!deletedUser) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      // Limpiar cookie
      res.clearCookie('token');

      res.json({ 
        success: true, 
        message: 'Cuenta eliminada exitosamente' 
      });
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar cuenta' 
      });
    }
  },

  // Obtener todos los usuarios (solo admin)
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll();
      
      res.json({ 
        success: true, 
        count: users.length,
        users 
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener lista de usuarios' 
      });
    }
  },

  // Obtener planes asignados al usuario actual
  getMyPlans: async (req, res) => {
    try {
      const Plan = require('../models/Plan');
      const plans = await Plan.getUserPlans(req.user.id);
      
      res.json({ 
        success: true, 
        plans 
      });
    } catch (error) {
      console.error('Error al obtener planes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener tus planes' 
      });
    }
  },

  // Actualizar estado de plan asignado
  updatePlanStatus: async (req, res) => {
    try {
      const planId = parseInt(req.params.planId, 10);
      const { status } = req.body;

      if (Number.isNaN(planId) || !status) {
        return res.status(400).json({ 
          success: false, 
          message: 'Plan ID y estado requeridos' 
        });
      }

      if (!['active', 'completed', 'archived'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Estado inválido' 
        });
      }

      const Plan = require('../models/Plan');
      // Reasignar con el nuevo estado (upsert actualiza)
      const updated = await Plan.assignToUser(req.user.id, planId, status);

      if (!updated) {
        return res.status(404).json({ 
          success: false, 
          message: 'Plan no encontrado o no asignado' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Estado actualizado',
        assignment: updated
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error del servidor' 
      });
    }
  }
};

module.exports = userController;
