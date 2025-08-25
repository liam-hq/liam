BEGIN;

-- Update artifacts to convert description strings to arrays
-- This migration splits comma-separated description strings into arrays
UPDATE public.artifacts
SET artifact = jsonb_set(
  artifact,
  '{requirement_analysis,requirements}',
  COALESCE(
    (
      SELECT jsonb_agg(
        CASE 
          -- If description is null, convert to empty array
          WHEN jsonb_typeof(req.value -> 'description') = 'null' THEN
            jsonb_set(req.value, '{description}', '[]'::jsonb)
          -- If description is a string, convert to array
          WHEN jsonb_typeof(req.value -> 'description') = 'string' THEN
            -- Use jsonb_set to preserve all other fields in the requirement object
            jsonb_set(
              req.value,
              '{description}',
              CASE 
                -- Split by ', ' if it looks like a comma-separated list
                WHEN (req.value ->> 'description') LIKE '%, %' THEN
                  to_jsonb(string_to_array(req.value ->> 'description', ', '))
                -- Otherwise, wrap single string in array
                ELSE
                  jsonb_build_array(req.value ->> 'description')
              END
            )
          -- If already an array or other type, keep as is
          ELSE 
            req.value
        END
      )
      FROM jsonb_array_elements(artifact -> 'requirement_analysis' -> 'requirements') AS req(value)
    ),
    '[]'::jsonb  -- Return empty array if NULL
  )
)
WHERE artifact -> 'requirement_analysis' -> 'requirements' IS NOT NULL
  AND jsonb_typeof(artifact -> 'requirement_analysis' -> 'requirements') = 'array'
  -- Only update rows that have at least one string or null description
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(artifact -> 'requirement_analysis' -> 'requirements') AS r(value)
    WHERE jsonb_typeof(r.value -> 'description') IN ('string', 'null')
  );

-- Verify the migration by checking if any string or null descriptions remain
DO $$
DECLARE
  remaining_non_arrays INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO remaining_non_arrays
  FROM public.artifacts,
       jsonb_array_elements(artifact -> 'requirement_analysis' -> 'requirements') AS req(value)
  WHERE jsonb_typeof(req.value -> 'description') IN ('string', 'null');
  
  IF remaining_non_arrays > 0 THEN
    RAISE NOTICE 'Found % requirements with non-array descriptions still remaining', remaining_non_arrays;
  ELSE
    RAISE NOTICE 'Migration successful: All descriptions are now arrays';
  END IF;
END $$;

COMMIT;