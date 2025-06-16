create table "public"."review_feedback_knowledge_suggestion_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_feedback_id" "uuid" references "review_feedbacks",
    "knowledge_suggestion_id" "uuid" references "knowledge_suggestions",
    "created_at" timestamp(3) with time zone not null default CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) with time zone not null
);

GRANT ALL ON TABLE "public"."review_feedback_knowledge_suggestion_mappings" TO "anon";
GRANT ALL ON TABLE "public"."review_feedback_knowledge_suggestion_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."review_feedback_knowledge_suggestion_mappings" TO "service_role";

