-- First, ensure we have some basic exercises
INSERT INTO exercises (id, name, description, duration_minutes, target_areas, is_work_friendly) 
VALUES 
  -- Office Worker Exercises
  ('e1', 'Standing Break', 'Take a break from sitting and walk around', 5, ARRAY['legs', 'circulation'], true),
  ('e2', 'Eye Relief', 'Focus on distant objects and blink exercises', 2, ARRAY['eyes'], true),
  ('e3', 'Wrist Stretches', 'Gentle wrist rotations and stretches', 2, ARRAY['wrists', 'hands'], true),
  ('e4', 'Posture Check', 'Align your spine and adjust seating position', 1, ARRAY['back', 'neck'], true),
  
  -- Nurse Exercises
  ('e5', 'Sitting Break', 'Take a moment to rest and elevate feet', 5, ARRAY['legs', 'feet'], true),
  ('e6', 'Back Support', 'Gentle back stretches and strengthening', 3, ARRAY['back'], true),
  ('e7', 'Foot Relief', 'Simple foot and ankle exercises', 2, ARRAY['feet', 'ankles'], true),
  ('e8', 'Shoulder Release', 'Release tension from lifting and moving', 2, ARRAY['shoulders'], true)
ON CONFLICT (id) DO NOTHING;

-- Then link exercises to professions
INSERT INTO profession_exercises (profession_id, exercise_id, priority, recommended_frequency, reason)
SELECT 
  p.id,
  e.id,
  CASE 
    WHEN p.name = 'Office Worker' AND e.name IN ('Standing Break', 'Eye Relief') THEN 1
    WHEN p.name = 'Office Worker' AND e.name IN ('Wrist Stretches', 'Posture Check') THEN 2
    WHEN p.name = 'Nurse' AND e.name IN ('Sitting Break', 'Foot Relief') THEN 1
    WHEN p.name = 'Nurse' AND e.name IN ('Back Support', 'Shoulder Release') THEN 2
    ELSE 3
  END as priority,
  CASE 
    WHEN e.name IN ('Standing Break', 'Sitting Break') THEN 'Every 2 hours'
    ELSE 'Every 1 hour'
  END as recommended_frequency,
  CASE
    WHEN p.name = 'Office Worker' AND e.name = 'Standing Break' THEN 'Combat prolonged sitting'
    WHEN p.name = 'Office Worker' AND e.name = 'Eye Relief' THEN 'Reduce eye strain'
    WHEN p.name = 'Office Worker' AND e.name = 'Wrist Stretches' THEN 'Prevent carpal tunnel'
    WHEN p.name = 'Office Worker' AND e.name = 'Posture Check' THEN 'Improve posture'
    WHEN p.name = 'Nurse' AND e.name = 'Sitting Break' THEN 'Rest from prolonged standing'
    WHEN p.name = 'Nurse' AND e.name = 'Back Support' THEN 'Prevent back strain'
    WHEN p.name = 'Nurse' AND e.name = 'Foot Relief' THEN 'Reduce foot fatigue'
    WHEN p.name = 'Nurse' AND e.name = 'Shoulder Release' THEN 'Ease lifting strain'
  END as reason
FROM professions p, exercises e
WHERE 
  (p.name = 'Office Worker' AND e.name IN ('Standing Break', 'Eye Relief', 'Wrist Stretches', 'Posture Check'))
  OR 
  (p.name = 'Nurse' AND e.name IN ('Sitting Break', 'Back Support', 'Foot Relief', 'Shoulder Release'))
ON CONFLICT DO NOTHING; 