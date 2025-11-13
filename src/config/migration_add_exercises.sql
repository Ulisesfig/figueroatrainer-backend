-- Migración: Crear tabla exercises
-- Descripción: Tabla para almacenar ejercicios con series, repeticiones, observaciones y video de YouTube
-- Fecha: 2025-11-13

-- Crear tabla exercises
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sets INTEGER NOT NULL CHECK (sets >= 1 AND sets <= 20),
  reps INTEGER NOT NULL CHECK (reps >= 1 AND reps <= 100),
  notes TEXT,
  youtube_url VARCHAR(500),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises(created_by);
CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at DESC);

-- Comentarios
COMMENT ON TABLE exercises IS 'Catálogo de ejercicios para planes de entrenamiento';
COMMENT ON COLUMN exercises.name IS 'Nombre del ejercicio';
COMMENT ON COLUMN exercises.sets IS 'Cantidad de series (1-20)';
COMMENT ON COLUMN exercises.reps IS 'Cantidad de repeticiones por serie (1-100)';
COMMENT ON COLUMN exercises.notes IS 'Observaciones o instrucciones adicionales';
COMMENT ON COLUMN exercises.youtube_url IS 'URL del video demostrativo en YouTube';
COMMENT ON COLUMN exercises.created_by IS 'ID del usuario que creó el ejercicio (admin)';
