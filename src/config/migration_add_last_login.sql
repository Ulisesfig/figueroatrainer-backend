-- Migración: Agregar columna last_login a users si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;
  END IF;
END $$;

-- Índice opcional para consultas por actividad reciente
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
