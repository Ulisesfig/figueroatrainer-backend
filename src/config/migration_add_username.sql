-- Migración: Agregar campos username y document_type a la tabla users
-- Ejecutar este script si ya tienes datos en la base de datos

-- Agregar columnas si no existen
DO $$ 
BEGIN
  -- Agregar username si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='username') THEN
    ALTER TABLE users ADD COLUMN username VARCHAR(50);
  END IF;

  -- Agregar document_type si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='document_type') THEN
    ALTER TABLE users ADD COLUMN document_type VARCHAR(20);
  END IF;
END $$;

-- Actualizar registros existentes con valores temporales
-- IMPORTANTE: Después de ejecutar esto, deberás actualizar manualmente los valores reales
UPDATE users 
SET username = COALESCE(username, 'temp_' || id),
    document_type = COALESCE(document_type, 'DNI')
WHERE username IS NULL OR document_type IS NULL;

-- Hacer las columnas NOT NULL y UNIQUE
ALTER TABLE users 
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN document_type SET NOT NULL;

-- Agregar constraint UNIQUE para phone si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
  END IF;
END $$;

-- Agregar constraint UNIQUE para username si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Verificar cambios
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
