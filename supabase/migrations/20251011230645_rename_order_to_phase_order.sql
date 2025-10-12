-- Rename "order" column to "phase_order" to avoid reserved keyword conflict
-- The "order" keyword is reserved in SQL and causes issues with Supabase PostgREST queries

-- Note: This change may have already been applied directly via psql
-- This migration documents the change for version control

-- Safely rename the column if it still exists with the old name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'phase_prompts'
        AND column_name = 'order'
    ) THEN
        ALTER TABLE phase_prompts RENAME COLUMN "order" TO phase_order;
        RAISE NOTICE 'Renamed column "order" to "phase_order"';
    ELSE
        RAISE NOTICE 'Column "order" does not exist, assuming already renamed to "phase_order"';
    END IF;
END $$;

-- Add helpful comment (only if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'phase_prompts'
        AND column_name = 'phase_order'
    ) THEN
        EXECUTE 'COMMENT ON COLUMN phase_prompts.phase_order IS ''Phase sequence number (1-7). Renamed from "order" to avoid SQL reserved keyword conflict.''';
    END IF;
END $$;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
