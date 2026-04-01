-- Historial de evolución de pesos por ejercicio y usuario
CREATE TABLE IF NOT EXISTS user_exercise_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id VARCHAR(100) NOT NULL,
  exercise_name VARCHAR(120) NOT NULL,
  weight DECIMAL(6, 2) NOT NULL,
  reps INTEGER DEFAULT NULL,
  source VARCHAR(30) DEFAULT 'manual',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_exercise_history_user_id ON user_exercise_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exercise_history_exercise ON user_exercise_history(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_exercise_history_recorded_at ON user_exercise_history(recorded_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_exercise_history' AND column_name='reps') THEN
    ALTER TABLE user_exercise_history ADD COLUMN reps INTEGER DEFAULT NULL;
  END IF;
END $$;

-- Seed inicial desde peso actual para usuarios que no tengan historial previo.
INSERT INTO user_exercise_history (user_id, exercise_id, exercise_name, weight, reps, source, recorded_at)
SELECT
  ue.user_id,
  ue.exercise_id,
  COALESCE(NULLIF(ue.exercise_name, ''), ue.exercise_id) AS exercise_name,
  COALESCE(ue.weight, 0) AS weight,
  ue.reps,
  'seed',
  COALESCE(ue.weight_updated_at, ue.updated_at, ue.created_at, CURRENT_TIMESTAMP)
FROM user_exercises ue
WHERE NOT EXISTS (
  SELECT 1
  FROM user_exercise_history h
  WHERE h.user_id = ue.user_id AND h.exercise_id = ue.exercise_id
);