-- Migración: Agregar columna topic a contacts si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'topic'
  ) THEN
    ALTER TABLE contacts ADD COLUMN topic VARCHAR(50) NOT NULL DEFAULT 'otro';
  END IF;
END $$;

-- Índice opcional para filtros por tema
CREATE INDEX IF NOT EXISTS idx_contacts_topic ON contacts(topic);
