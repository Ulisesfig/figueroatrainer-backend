-- Migración: Crear tablas plans y user_plans
DO $$ 
BEGIN
  -- Tabla de planes (entrenamiento y nutrición)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='plans') THEN
    CREATE TABLE plans (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'training',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_category CHECK (category IN ('training', 'nutrition'))
    );
  END IF;

  -- Tabla de asignación de planes a usuarios
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_plans') THEN
    CREATE TABLE user_plans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'active',
      CONSTRAINT unique_user_plan UNIQUE (user_id, plan_id),
      CONSTRAINT check_status CHECK (status IN ('active', 'completed', 'archived'))
    );
  END IF;
END $$;

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_plans_category ON plans(category);
CREATE INDEX IF NOT EXISTS idx_plans_created_by ON plans(created_by);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_id ON user_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(status);

-- Trigger para actualizar updated_at en plans
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_plans_updated_at_trigger ON plans;
CREATE TRIGGER update_plans_updated_at_trigger
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_updated_at();

