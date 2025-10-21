const Plan = require('../models/Plan');

const planController = {
  // Crear un nuevo plan
  create: async (req, res) => {
    try {
      const { title, description, content, category } = req.body;

      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Título y contenido son requeridos' });
      }

      if (category && !['training', 'nutrition'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Categoría inválida' });
      }

      const plan = await Plan.create({
        title,
        description,
        content,
        category: category || 'training',
        createdBy: req.user.id
      });

      res.status(201).json({ success: true, message: 'Plan creado', plan });
    } catch (error) {
      console.error('Error creando plan:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Listar planes con paginación
  list: async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '50', 10);
      const category = req.query.category || null;

      const [plans, total] = await Promise.all([
        Plan.findAll(page, limit, category),
        Plan.countAll(category)
      ]);

      res.json({
        success: true,
        plans,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error listando planes:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Obtener plan por ID
  getById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }

      const plan = await Plan.findById(id);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Plan no encontrado' });
      }

      res.json({ success: true, plan });
    } catch (error) {
      console.error('Error obteniendo plan:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Actualizar plan
  update: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }

      const { title, description, content, category } = req.body;

      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Título y contenido son requeridos' });
      }

      if (category && !['training', 'nutrition'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Categoría inválida' });
      }

      const plan = await Plan.update(id, { title, description, content, category });
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Plan no encontrado' });
      }

      res.json({ success: true, message: 'Plan actualizado', plan });
    } catch (error) {
      console.error('Error actualizando plan:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Eliminar plan
  delete: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }

      const deleted = await Plan.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Plan no encontrado' });
      }

      res.json({ success: true, message: 'Plan eliminado', id: deleted.id });
    } catch (error) {
      console.error('Error eliminando plan:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Asignar plan a usuario
  assignToUser: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const { planId, status } = req.body;

      if (Number.isNaN(userId) || !planId) {
        return res.status(400).json({ success: false, message: 'ID de usuario y plan requeridos' });
      }

      const assignment = await Plan.assignToUser(userId, planId, status || 'active');
      res.json({ success: true, message: 'Plan asignado', assignment });
    } catch (error) {
      console.error('Error asignando plan:', error);
      if (error.code === '23503') {
        return res.status(404).json({ success: false, message: 'Usuario o plan no encontrado' });
      }
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Obtener planes de un usuario
  getUserPlans: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
      }

      const plans = await Plan.getUserPlans(userId);
      res.json({ success: true, plans });
    } catch (error) {
      console.error('Error obteniendo planes de usuario:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Remover asignación de plan
  removeFromUser: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const planId = parseInt(req.params.planId, 10);

      if (Number.isNaN(userId) || Number.isNaN(planId)) {
        return res.status(400).json({ success: false, message: 'IDs inválidos' });
      }

      const removed = await Plan.removeFromUser(userId, planId);
      if (!removed) {
        return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
      }

      res.json({ success: true, message: 'Plan removido del usuario' });
    } catch (error) {
      console.error('Error removiendo plan:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Obtener conteo de usuarios asignados a un plan
  assignmentCount: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      const count = await Plan.countAssignments(id);
      res.json({ success: true, count });
    } catch (error) {
      console.error('Error obteniendo conteo de asignaciones:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  },

  // Obtener usuarios asignados a un plan
  assignees: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      const users = await Plan.getAssignees(id);
      res.json({ success: true, users });
    } catch (error) {
      console.error('Error obteniendo usuarios asignados:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  }
};

module.exports = planController;
