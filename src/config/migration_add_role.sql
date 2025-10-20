-- Migración: Agregar columna role y defaults
DO $$ 
BEGIN
  -- Agregar role si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
  END IF;

  -- Asegurar default de document_type
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='document_type') THEN
    ALTER TABLE users ALTER COLUMN document_type SET DEFAULT 'dni';
  END IF;
END $$;

-- Crear índice para role si no existe
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
