-- Make professions more flexible
ALTER TABLE professions 
ADD COLUMN IF NOT EXISTS ai_analyzed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS work_characteristics jsonb DEFAULT '[]';

-- Create a table for profession characteristics
CREATE TABLE IF NOT EXISTS profession_characteristics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  physical_demands text[],
  workplace_environment text[],
  common_movements text[],
  health_considerations text[]
);

-- Add function to analyze new professions
CREATE OR REPLACE FUNCTION analyze_new_profession(profession_name text)
RETURNS uuid AS $$
DECLARE
  new_profession_id uuid;
BEGIN
  -- Create new profession entry
  INSERT INTO professions (name, category, ai_analyzed)
  VALUES (profession_name, 'custom', true)
  RETURNING id INTO new_profession_id;
  
  RETURN new_profession_id;
END;
$$ LANGUAGE plpgsql; 