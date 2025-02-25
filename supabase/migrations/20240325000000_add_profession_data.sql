-- First check if columns exist
DO $$ 
BEGIN
    -- Check if profession_data column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profession_data'
    ) THEN
        -- Add profession_data column if it doesn't exist
        ALTER TABLE users 
        ADD COLUMN profession_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Check if profession_validated column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profession_validated'
    ) THEN
        -- Add profession_validated column if it doesn't exist
        ALTER TABLE users 
        ADD COLUMN profession_validated BOOLEAN DEFAULT false;
    END IF;

    -- Check if index exists before creating it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_users_profession_validated'
    ) THEN
        -- Create index if it doesn't exist
        CREATE INDEX idx_users_profession_validated 
        ON users(profession_validated);
    END IF;
END $$;

-- Update any null profession_data values
UPDATE users 
SET profession_data = '{}'::jsonb 
WHERE profession_data IS NULL; 