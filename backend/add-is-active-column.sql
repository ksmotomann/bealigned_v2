-- Add is_active column to refinements table
ALTER TABLE refinements 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update any existing refinements to be active
UPDATE refinements 
SET is_active = true 
WHERE is_active IS NULL;