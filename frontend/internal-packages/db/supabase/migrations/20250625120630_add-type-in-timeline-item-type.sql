-- Add 'progress' to timeline_item_type_enum
ALTER TYPE timeline_item_type_enum ADD VALUE 'progress';

-- Add progress column to timeline_items table
ALTER TABLE timeline_items ADD COLUMN progress INTEGER;

-- Add comment to explain the progress column
COMMENT ON COLUMN timeline_items.progress IS 'Progress percentage (0-100) for progress type timeline items. Only set when type is progress.';
