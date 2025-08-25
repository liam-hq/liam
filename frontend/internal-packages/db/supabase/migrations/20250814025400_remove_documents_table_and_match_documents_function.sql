
BEGIN;

DROP POLICY IF EXISTS "authenticated_users_can_select_org_documents" ON "public"."documents";
DROP POLICY IF EXISTS "authenticated_users_can_insert_org_documents" ON "public"."documents";
DROP POLICY IF EXISTS "authenticated_users_can_update_org_documents" ON "public"."documents";
DROP POLICY IF EXISTS "authenticated_users_can_delete_org_documents" ON "public"."documents";
DROP POLICY IF EXISTS "service_role_can_select_all_documents" ON "public"."documents";
DROP POLICY IF EXISTS "service_role_can_insert_all_documents" ON "public"."documents";
DROP POLICY IF EXISTS "service_role_can_update_all_documents" ON "public"."documents";
DROP POLICY IF EXISTS "service_role_can_delete_all_documents" ON "public"."documents";

DROP FUNCTION IF EXISTS "public"."match_documents"("filter" "jsonb", "match_count" integer, "query_embedding" "public"."vector", "match_threshold" double precision);

DROP TABLE IF EXISTS "public"."documents";

COMMIT;
