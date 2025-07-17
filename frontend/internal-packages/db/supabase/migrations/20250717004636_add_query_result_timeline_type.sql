-- Add 'query_result' to timeline_item_type_enum
ALTER TYPE timeline_item_type_enum ADD VALUE 'query_result';

-- Add columns to timeline_items table for query result data
ALTER TABLE timeline_items 
ADD COLUMN query_result_id uuid,
ADD COLUMN query_results jsonb;

-- Add index for query_result_id
CREATE INDEX timeline_items_query_result_id_idx ON timeline_items (query_result_id) WHERE query_result_id IS NOT NULL;

-- Add foreign key constraint to validation_queries table
ALTER TABLE timeline_items
ADD CONSTRAINT timeline_items_query_result_id_fkey 
FOREIGN KEY (query_result_id) 
REFERENCES validation_queries(id) 
ON DELETE CASCADE;