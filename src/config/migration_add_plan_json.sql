-- Migración: Agregar columna JSON a planes para estructura por días
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='plans' AND column_name='content_json'
  ) THEN
    ALTER TABLE plans ADD COLUMN content_json JSONB;
  END IF;
END $$;

-- Índice opcional para consultas por JSON
CREATE INDEX IF NOT EXISTS idx_plans_content_json ON plans USING GIN (content_json);
