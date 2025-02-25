-- Add health risks to professions
ALTER TABLE professions
ADD COLUMN IF NOT EXISTS common_issues jsonb DEFAULT '[]';

-- Create table for profession-specific exercises
CREATE TABLE IF NOT EXISTS profession_exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profession_id uuid REFERENCES professions(id),
  exercise_id uuid REFERENCES exercises(id),
  priority int DEFAULT 1,
  recommended_frequency text,
  reason text,
  contraindicated boolean DEFAULT false
);

-- Update professions with common issues
UPDATE professions 
SET common_issues = 
  CASE name
    WHEN 'Office Worker' THEN 
      '[
        {"issue": "prolonged_sitting", "severity": "high"},
        {"issue": "eye_strain", "severity": "high"},
        {"issue": "carpal_tunnel", "severity": "medium"},
        {"issue": "poor_posture", "severity": "high"}
      ]'::jsonb
    WHEN 'Nurse' THEN 
      '[
        {"issue": "prolonged_standing", "severity": "high"},
        {"issue": "back_strain", "severity": "high"},
        {"issue": "foot_pain", "severity": "high"}
      ]'::jsonb
    -- Add other professions...
  END
WHERE name IN ('Office Worker', 'Nurse'); 