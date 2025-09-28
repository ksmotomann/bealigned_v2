-- Add refinement_type column to refinements table
ALTER TABLE refinements 
ADD COLUMN IF NOT EXISTS refinement_type VARCHAR(50) DEFAULT 'alternative';

-- Update any existing refinements to have a type
UPDATE refinements 
SET refinement_type = 'alternative' 
WHERE refinement_type IS NULL;