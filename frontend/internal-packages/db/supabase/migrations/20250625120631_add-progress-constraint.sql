-- Add constraint to ensure progress is only set when type is 'progress'
ALTER TABLE timeline_items ADD CONSTRAINT timeline_items_progress_check 
  CHECK (
    (type = 'progress' AND progress IS NOT NULL AND progress >= 0 AND progress <= 100) OR
    (type != 'progress' AND progress IS NULL)
  );
