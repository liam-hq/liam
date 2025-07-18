-- Create assistant_role enum type
CREATE TYPE assistant_role_enum AS ENUM ('db', 'pm', 'qa');

-- Add assistant_role column to timeline_items table
ALTER TABLE timeline_items
ADD COLUMN assistant_role assistant_role_enum;