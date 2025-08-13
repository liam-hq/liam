CREATE TABLE IF NOT EXISTS "public"."public_share_settings" (
    "design_session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."public_share_settings" OWNER TO "postgres";

GRANT SELECT ON TABLE "public"."public_share_settings" TO "anon";
GRANT SELECT ON TABLE "public"."design_sessions" TO "anon";
GRANT SELECT ON TABLE "public"."artifacts" TO "anon";
GRANT SELECT ON TABLE "public"."building_schema_versions" TO "anon";
GRANT SELECT ON TABLE "public"."building_schemas" TO "anon";
GRANT SELECT ON TABLE "public"."timeline_items" TO "anon";





ALTER TABLE ONLY "public"."public_share_settings"
    ADD CONSTRAINT "public_share_settings_pkey" PRIMARY KEY ("design_session_id");


CREATE INDEX "idx_public_share_settings_created_at" ON "public"."public_share_settings" USING "btree" ("created_at");


ALTER TABLE ONLY "public"."public_share_settings"
    ADD CONSTRAINT "public_share_settings_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE "public"."public_share_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_users_can_delete_org_public_share_settings" ON "public"."public_share_settings" FOR DELETE TO "authenticated" USING (("design_session_id" IN ( SELECT "ds"."id"
   FROM "public"."design_sessions" "ds"
  WHERE ("ds"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"()))))));


CREATE POLICY "authenticated_users_can_insert_org_public_share_settings" ON "public"."public_share_settings" FOR INSERT TO "authenticated" WITH CHECK (("design_session_id" IN ( SELECT "ds"."id"
   FROM "public"."design_sessions" "ds"
  WHERE ("ds"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"()))))));


CREATE POLICY "authenticated_users_can_select_org_public_share_settings" ON "public"."public_share_settings" FOR SELECT TO "authenticated" USING (("design_session_id" IN ( SELECT "ds"."id"
   FROM "public"."design_sessions" "ds"
  WHERE ("ds"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"()))))));


CREATE POLICY "public_artifacts_read" ON "public"."artifacts" FOR SELECT TO "anon" USING (("design_session_id" IN ( SELECT "public_share_settings"."design_session_id"
   FROM "public"."public_share_settings")));


CREATE POLICY "public_building_schema_versions_read" ON "public"."building_schema_versions" FOR SELECT TO "anon" USING (("building_schema_id" IN ( SELECT "bs"."id"
   FROM "public"."building_schemas" "bs"
  WHERE ("bs"."design_session_id" IN ( SELECT "public_share_settings"."design_session_id"
           FROM "public"."public_share_settings")))));


CREATE POLICY "public_building_schemas_read" ON "public"."building_schemas" FOR SELECT TO "anon" USING (("design_session_id" IN ( SELECT "public_share_settings"."design_session_id"
   FROM "public"."public_share_settings")));


CREATE POLICY "public_sessions_read" ON "public"."design_sessions" FOR SELECT TO "anon" USING (("id" IN ( SELECT "public_share_settings"."design_session_id"
   FROM "public"."public_share_settings")));


CREATE POLICY "public_timeline_items_read" ON "public"."timeline_items" FOR SELECT TO "anon" USING (("design_session_id" IN ( SELECT "public_share_settings"."design_session_id"
   FROM "public"."public_share_settings")));
