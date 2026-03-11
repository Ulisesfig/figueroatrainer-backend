-- Agregar columna mobile_enabled a la tabla users
-- Por defecto FALSE: ningún usuario tiene acceso a la app móvil hasta que el admin lo habilite
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mobile_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice opcional para filtrar rápido desde el admin
CREATE INDEX IF NOT EXISTS idx_users_mobile_enabled ON users (mobile_enabled);
