DO
$$
BEGIN
  IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'building_schema_versions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE building_schema_versions;
  END IF;
END
$$;