const Exercise = require('../models/Exercise');

const exerciseController = {
  // Crear nuevo ejercicio
  create: async (req, res) => {
    try {
      const { name, category, sets, reps, notes, youtube_url, suggested_weight, variant_exercise_id } = req.body;

      // Validaciones - solo nombre es obligatorio
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del ejercicio es obligatorio'
        });
      }

      if (sets !== null && sets !== undefined && (sets < 1 || sets > 20)) {
        return res.status(400).json({
          success: false,
          message: 'Las series deben estar entre 1 y 20'
        });
      }

      if (reps !== null && reps !== undefined && (reps < 1 || reps > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Las repeticiones deben estar entre 1 y 100'
        });
      }

      // Validar URL de YouTube si se proporciona
      if (youtube_url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        if (!youtubeRegex.test(youtube_url)) {
          return res.status(400).json({
            success: false,
            message: 'URL de YouTube inválida'
          });
        }
      }

      // Validar que el ejercicio variante existe si se proporciona
      if (variant_exercise_id) {
        const variantExists = await Exercise.findById(variant_exercise_id);
        if (!variantExists) {
          return res.status(400).json({
            success: false,
            message: 'El ejercicio variante especificado no existe'
          });
        }
      }

      const exerciseData = {
        name: name.trim(),
        category: category ? category.trim() : null,
        sets: sets ? parseInt(sets, 10) : null,
        reps: reps ? parseInt(reps, 10) : null,
        notes: notes ? notes.trim() : null,
        youtube_url: youtube_url ? youtube_url.trim() : null,
        suggested_weight: suggested_weight ? parseFloat(suggested_weight) : null,
        variant_exercise_id: variant_exercise_id ? parseInt(variant_exercise_id, 10) : null,
        created_by: req.user?.id || null
      };

      const exercise = await Exercise.create(exerciseData);

      res.status(201).json({
        success: true,
        message: 'Ejercicio creado exitosamente',
        exercise
      });
    } catch (error) {
      console.error('Error creando ejercicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor al crear ejercicio'
      });
    }
  },

  // Listar todos los ejercicios
  list: async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '100', 10);

      const [exercises, total] = await Promise.all([
        Exercise.findAll(page, limit),
        Exercise.countAll()
      ]);

      res.json({
        success: true,
        exercises,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error listando ejercicios:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor al listar ejercicios'
      });
    }
  },

  // Obtener ejercicio por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const exercise = await Exercise.findById(id);

      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: 'Ejercicio no encontrado'
        });
      }

      res.json({
        success: true,
        exercise
      });
    } catch (error) {
      console.error('Error obteniendo ejercicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  },

  // Buscar ejercicios por nombre
  search: async (req, res) => {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'La búsqueda requiere al menos 2 caracteres'
        });
      }

      const exercises = await Exercise.searchByName(q.trim());

      res.json({
        success: true,
        exercises
      });
    } catch (error) {
      console.error('Error buscando ejercicios:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  },

  // Actualizar ejercicio
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category, sets, reps, notes, youtube_url, suggested_weight, variant_exercise_id } = req.body;

      // Verificar que existe
      const existing = await Exercise.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Ejercicio no encontrado'
        });
      }

      // Validaciones - solo nombre es obligatorio
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del ejercicio es obligatorio'
        });
      }

      if (youtube_url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        if (!youtubeRegex.test(youtube_url)) {
          return res.status(400).json({
            success: false,
            message: 'URL de YouTube inválida'
          });
        }
      }

      // Validar que el ejercicio variante existe si se proporciona
      if (variant_exercise_id) {
        // No puede ser variante de sí mismo
        if (parseInt(variant_exercise_id, 10) === parseInt(id, 10)) {
          return res.status(400).json({
            success: false,
            message: 'Un ejercicio no puede ser variante de sí mismo'
          });
        }
        const variantExists = await Exercise.findById(variant_exercise_id);
        if (!variantExists) {
          return res.status(400).json({
            success: false,
            message: 'El ejercicio variante especificado no existe'
          });
        }
      }

      const exerciseData = {
        name: name.trim(),
        category: category ? category.trim() : null,
        sets: sets ? parseInt(sets, 10) : null,
        reps: reps ? parseInt(reps, 10) : null,
        notes: notes ? notes.trim() : null,
        youtube_url: youtube_url ? youtube_url.trim() : null,
        suggested_weight: suggested_weight ? parseFloat(suggested_weight) : null,
        variant_exercise_id: variant_exercise_id ? parseInt(variant_exercise_id, 10) : null
      };

      const exercise = await Exercise.update(id, exerciseData);

      res.json({
        success: true,
        message: 'Ejercicio actualizado exitosamente',
        exercise
      });
    } catch (error) {
      console.error('Error actualizando ejercicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  },

  // Eliminar ejercicio
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await Exercise.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Ejercicio no encontrado'
        });
      }

      await Exercise.delete(id);

      res.json({
        success: true,
        message: 'Ejercicio eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando ejercicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }
};

module.exports = exerciseController;
