-- First, ensure there are no 'progress' type records in the table
DELETE FROM timeline_items WHERE type = 'progress';

-- Remove progress column from timeline_items table
ALTER TABLE timeline_items DROP COLUMN IF EXISTS progress;

-- Remove progress constraint (if it exists)
ALTER TABLE timeline_items DROP CONSTRAINT IF EXISTS timeline_items_progress_check;

-- Remove 'progress' from timeline_item_type_enum by recreating the enum
-- Step 1: Create a new enum without 'progress'
CREATE TYPE timeline_item_type_enum_new AS ENUM ('user', 'assistant', 'schema_version', 'error');

-- Step 2: Add a temporary column with the new enum type
ALTER TABLE timeline_items ADD COLUMN type_new timeline_item_type_enum_new;

-- Step 3: Update the temporary column with converted values
UPDATE timeline_items SET type_new = type::text::timeline_item_type_enum_new;

-- Step 4: Drop the old column and rename the new one
ALTER TABLE timeline_items DROP COLUMN type;
ALTER TABLE timeline_items RENAME COLUMN type_new TO type;

-- Step 5: Add NOT NULL constraint back
ALTER TABLE timeline_items ALTER COLUMN type SET NOT NULL;

-- Step 6: Drop the old enum and rename the new one
DROP TYPE timeline_item_type_enum;
ALTER TYPE timeline_item_type_enum_new RENAME TO timeline_item_type_enum;