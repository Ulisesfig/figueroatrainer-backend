const Plan = require('../models/Plan');

function normalizeRir(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 2) return null;
  return parsed;
}

function normalizeSectionItems(input) {
  const toItem = (value) => {
    if (!value && value !== 0) return null;

    if (typeof value === 'string') {
      const cleaned = value.replace(/^[-*\s]+/, '').trim();
      if (!cleaned) return null;
      return { name: cleaned, notes: null, duration: null };
    }

    if (typeof value === 'object') {
      const name = String(value.name || value.title || '').trim();
      if (!name) return null;
      // Si tiene campos de ejercicio (sets/reps/youtube_url) conservarlos como está
      if (value.sets != null || value.reps != null || value.youtube_url || value.id) {
        return {
          id: value.id || null,
          name,
          sets: value.sets != null ? parseInt(value.sets, 10) : null,
          reps: value.reps != null ? parseInt(value.reps, 10) : null,
          rir: normalizeRir(value.rir),
          suggested_weight: value.suggested_weight != null ? parseFloat(value.suggested_weight) : null,
          notes: value.notes ? String(value.notes).trim() : null,
          youtube_url: value.youtube_url || value.youtube || null,
          variant: value.variant || null
        };
      }
      const notes = value.notes ? String(value.notes).trim() : null;
      const duration = value.duration ? String(value.duration).trim() : null;
      return { name, notes: notes || null, duration: duration || null };
    }

    return null;
  };

  if (Array.isArray(input)) {
    return input.map(toItem).filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(/\r?\n/)
      .map((line) => toItem(line))
      .filter(Boolean);
  }

  return [];
}

function buildSectionText(label, items) {
  if (!Array.isArray(items) || !items.length) return '';
  const lines = items.map((item) => {
    const parts = [item.name];
    if (item.sets != null && item.reps != null) parts.push(`${item.sets}x${item.reps}`);
    else if (item.sets != null) parts.push(`${item.sets} series`);
    if (item.rir != null) parts.push(`[RIR ${item.rir}]`);
    if (item.duration) parts.push(`[dur: ${item.duration}]`);
    if (item.notes) parts.push(`- ${item.notes}`);
    return `- ${parts.join(' ')}`;
  });
  return `${label}:\n${lines.join('\n')}`;
}

function normalizeStructuredPlan(days, body = {}) {
  const generalWarmup = normalizeSectionItems(body.general_warmup || body.generalWarmup);
  const generalMobility = normalizeSectionItems(body.general_mobility || body.generalMobility);

  const safeDays = days.map((d, idx) => ({
    day: d?.day || idx + 1,
    name: d?.name || null,
    warmup: normalizeSectionItems(d?.warmup || d?.calentamiento),
    mobility: normalizeSectionItems(d?.mobility || d?.movilidad),
    exercises: Array.isArray(d?.exercises) ? d.exercises.map(ex => {
      const exercise = {
        id: ex?.id ?? ex?.exercise_id ?? null,
        name: ex?.name || '',
        sets: ex?.sets != null ? parseInt(ex.sets, 10) : null,
        reps: ex?.reps != null ? parseInt(ex.reps, 10) : null,
        rir: normalizeRir(ex?.rir),
        suggested_weight: ex?.suggested_weight != null ? parseFloat(ex.suggested_weight) : null,
        notes: ex?.notes || ex?.observations || null,
        youtube_url: ex?.youtube_url || ex?.youtube || null
      };

      if (ex?.variant && ex.variant.name && ex.variant.youtube_url) {
        exercise.variant = {
          id: ex.variant.id ?? null,
          name: ex.variant.name,
          youtube_url: ex.variant.youtube_url,
          sets: ex.variant.sets != null ? parseInt(ex.variant.sets, 10) : null,
          reps: ex.variant.reps != null ? parseInt(ex.variant.reps, 10) : null,
          notes: ex.variant.notes || null,
          suggested_weight: ex.variant.suggested_weight != null ? parseFloat(ex.variant.suggested_weight) : null
        };
      }

      return exercise;
    }) : []
  }));

  const contentJson = {
    general: {
      warmup: generalWarmup,
      mobility: generalMobility
    },
    days: safeDays
  };

  const blocks = [];
  const generalWarmupText = buildSectionText('Calentamiento General', generalWarmup);
  const generalMobilityText = buildSectionText('Movilidad General', generalMobility);
  if (generalWarmupText) blocks.push(generalWarmupText);
  if (generalMobilityText) blocks.push(generalMobilityText);

  const dayBlocks = safeDays.map((d) => {
    const dayLabel = d.name ? `Día ${d.day} - ${d.name}` : `Día ${d.day}`;
    const dayParts = [`${dayLabel}:`];
    const warmupText = buildSectionText('Calentamiento', d.warmup);
    const mobilityText = buildSectionText('Movilidad', d.mobility);
    if (warmupText) dayParts.push(warmupText);
    if (mobilityText) dayParts.push(mobilityText);

    const exerciseLines = d.exercises.length
      ? d.exercises.map((ex, i) => {
          const parts = [];
          if (ex.id) parts.push(`[#ID=${ex.id}]`);
          if (ex.name) parts.push(`name=${ex.name}`);
          if (ex.sets != null) parts.push(`sets=${ex.sets}`);
          if (ex.reps != null) parts.push(`reps=${ex.reps}`);
          if (ex.rir != null) parts.push(`rir=${ex.rir}`);
          if (ex.suggested_weight != null) parts.push(`weight=${ex.suggested_weight}`);
          if (ex.notes) parts.push(`obs=${ex.notes}`);
          if (ex.youtube_url) parts.push(`yt=${ex.youtube_url}`);
          return `${i + 1}. ${parts.join(' | ')}`;
        }).join('\n')
      : 'Sin ejercicios';

    dayParts.push(exerciseLines);
    return dayParts.join('\n');
  });

  blocks.push(dayBlocks.join('\n\n'));

  return {
    contentJson,
    contentText: blocks.filter(Boolean).join('\n\n')
  };
}

const planController = {
  // Crear un nuevo plan
  create: async (req, res) => {
    try {
      const { title, description, content, category, days } = req.body;
      
      console.log('🔵 [CREATE PLAN] Datos recibidos:');
      console.log('  - Title:', title);
      console.log('  - Category:', category);
      console.log('  - Days array:', Array.isArray(days) ? `${days.length} días` : 'No days');
      if (Array.isArray(days)) {
        days.forEach((d, i) => {
          console.log(`  - Día ${i+1}: ${d?.exercises?.length || 0} ejercicios`);
        });
      }

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
        const structured = normalizeStructuredPlan(days, req.body || {});
        contentJson = structured.contentJson;
        contentText = structured.contentText;

        console.log('🟢 [CREATE PLAN] Content JSON construido:', JSON.stringify(contentJson, null, 2));
        console.log('🟢 [CREATE PLAN] Content text construido (primeras 300 chars):', contentText.substring(0, 300));
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
        const structured = normalizeStructuredPlan(days, req.body || {});
        contentJson = structured.contentJson;
        contentText = structured.contentText;
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
