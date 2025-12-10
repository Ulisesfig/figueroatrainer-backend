-- Migración: Hacer sets y reps opcionales en la tabla exercises
-- Fecha: 2025-12-10

-- Eliminar restricción NOT NULL de sets
ALTER TABLE exercises ALTER COLUMN sets DROP NOT NULL;

-- Eliminar restricción NOT NULL de reps
ALTER TABLE exercises ALTER COLUMN reps DROP NOT NULL;

-- Eliminar los CHECK constraints existentes y recrearlos permitiendo NULL
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_sets_check;
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_reps_check;

-- Recrear constraints permitiendo NULL
ALTER TABLE exercises ADD CONSTRAINT exercises_sets_check CHECK (sets IS NULL OR (sets >= 1 AND sets <= 20));
ALTER TABLE exercises ADD CONSTRAINT exercises_reps_check CHECK (reps IS NULL OR (reps >= 1 AND reps <= 100));

-- Verificar cambios
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'exercises' 
AND column_name IN ('sets', 'reps');
