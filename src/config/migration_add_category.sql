-- Migration: Add category column to exercises table
-- Date: 2024-01-XX
-- Description: Adds a category field to classify exercises by muscle group

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'category'
    ) THEN
        ALTER TABLE exercises ADD COLUMN category VARCHAR(50);
        RAISE NOTICE 'Column "category" added to exercises table';
    ELSE
        RAISE NOTICE 'Column "category" already exists in exercises table';
    END IF;
END $$;

-- Optional: Create an index for faster filtering by category
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);

COMMENT ON COLUMN exercises.category IS 'Muscle group or category (e.g., pecho, espalda, pierna, hombro, brazo, core, cardio, otro)';
