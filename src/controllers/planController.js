const Plan = require('../models/Plan');

const planController = {
  // Crear un nuevo plan
  create: async (req, res) => {
    try {
      const { title, description, content, category, days } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'El título es requerido' });
      }

      if (category && !['training', 'nutrition'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Categoría inválida' });
      }

      // Si vienen días estructurados, construir fallback de texto y JSON
      let contentText = content;
      let contentJson = null;
      if ((!content || typeof content !== 'string' || !content.trim()) && Array.isArray(days)) {
        // Normalizar estructura de days
        const safeDays = days.map((d, idx) => ({
          day: d?.day || idx + 1,
          exercises: Array.isArray(d?.exercises) ? d.exercises.map(ex => ({
            id: ex?.id ?? ex?.exercise_id ?? null,
            name: ex?.name || '',
            sets: ex?.sets != null ? parseInt(ex.sets, 10) : null,
            reps: ex?.reps != null ? parseInt(ex.reps, 10) : null,
            notes: ex?.notes || ex?.observations || null,
            youtube_url: ex?.youtube_url || ex?.youtube || null
          })) : []
        }));
        contentJson = { days: safeDays };
        // Fallback texto para compatibilidad
        contentText = safeDays.map(d => {
          const lines = d.exercises.length ? d.exercises.map((ex, i) => {
            const parts = [];
            if (ex.id) parts.push(`[#ID=${ex.id}]`);
            if (ex.name) parts.push(`name=${ex.name}`);
            if (ex.sets != null) parts.push(`sets=${ex.sets}`);
            if (ex.reps != null) parts.push(`reps=${ex.reps}`);
            if (ex.notes) parts.push(`obs=${ex.notes}`);
            if (ex.youtube_url) parts.push(`yt=${ex.youtube_url}`);
            return `${i + 1}. ${parts.join(' | ')}`;
          }).join('\n') : 'Sin ejercicios';
          return `Día ${d.day}:\n${lines}`;
        }).join('\n\n');
      }

      if (!contentText || !contentText.trim()) {
        return res.status(400).json({ success: false, message: 'Debe enviar contenido o días con ejercicios' });
      }

      const plan = await Plan.create({
        title,
        description,
        content: contentText,
        contentJson,
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

      const { title, description, content, category, days } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'El título es requerido' });
      }

      if (category && !['training', 'nutrition'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Categoría inválida' });
      }

      // Reconstruir si vienen days
      let contentText = content;
      let contentJson = null;
      if ((!content || typeof content !== 'string' || !content.trim()) && Array.isArray(days)) {
        const safeDays = days.map((d, idx) => ({
          day: d?.day || idx + 1,
          exercises: Array.isArray(d?.exercises) ? d.exercises.map(ex => ({
            id: ex?.id ?? ex?.exercise_id ?? null,
            name: ex?.name || '',
            sets: ex?.sets != null ? parseInt(ex.sets, 10) : null,
            reps: ex?.reps != null ? parseInt(ex.reps, 10) : null,
            notes: ex?.notes || ex?.observations || null,
            youtube_url: ex?.youtube_url || ex?.youtube || null
          })) : []
        }));
        contentJson = { days: safeDays };
        contentText = safeDays.map(d => {
          const lines = d.exercises.length ? d.exercises.map((ex, i) => {
            const parts = [];
            if (ex.id) parts.push(`[#ID=${ex.id}]`);
            if (ex.name) parts.push(`name=${ex.name}`);
            if (ex.sets != null) parts.push(`sets=${ex.sets}`);
            if (ex.reps != null) parts.push(`reps=${ex.reps}`);
            if (ex.notes) parts.push(`obs=${ex.notes}`);
            if (ex.youtube_url) parts.push(`yt=${ex.youtube_url}`);
            return `${i + 1}. ${parts.join(' | ')}`;
          }).join('\n') : 'Sin ejercicios';
          return `Día ${d.day}:\n${lines}`;
        }).join('\n\n');
      }

      if (!contentText || !contentText.trim()) {
        return res.status(400).json({ success: false, message: 'Debe enviar contenido o días con ejercicios' });
      }

      const plan = await Plan.update(id, { title, description, content: contentText, contentJson, category });
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
