-- Migración: Agregar campo suggested_weight a la tabla exercises
-- Fecha: 2025-12-10

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS suggested_weight DECIMAL(10,2) DEFAULT NULL;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'exercises' AND column_name = 'suggested_weight';
