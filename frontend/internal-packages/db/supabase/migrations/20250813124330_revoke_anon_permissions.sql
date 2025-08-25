-- 
--

BEGIN;

-- Revoke all table privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Revoke all sequence privileges
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Revoke function privileges selectively to avoid warnings from pgvector functions
DO $$
DECLARE
    func_name text;
BEGIN
    FOR func_name IN
        SELECT p.oid::regprocedure::text
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND NOT EXISTS (
            -- Exclude pgvector related functions
            SELECT 1 FROM pg_depend d
            JOIN pg_extension e ON d.refobjid = e.oid
            WHERE d.objid = p.oid
            AND e.extname = 'vector'
        )
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_name);
    END LOOP;
END $$;

-- Revoke default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;

-- Revoke schema usage
REVOKE USAGE ON SCHEMA public FROM anon;

COMMIT;
