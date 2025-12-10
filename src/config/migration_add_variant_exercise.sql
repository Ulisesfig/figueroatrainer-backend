-- Migración: Agregar campo variant_exercise_id a la tabla exercises
-- Descripción: Permite asignar un ejercicio variante/alternativo a cada ejercicio
-- Fecha: 2025-12-10

-- Agregar columna variant_exercise_id (referencia a otro ejercicio)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS variant_exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL;

-- Índice para mejorar rendimiento de búsquedas por variante
CREATE INDEX IF NOT EXISTS idx_exercises_variant ON exercises(variant_exercise_id);

-- Comentario
COMMENT ON COLUMN exercises.variant_exercise_id IS 'ID del ejercicio variante/alternativo';
