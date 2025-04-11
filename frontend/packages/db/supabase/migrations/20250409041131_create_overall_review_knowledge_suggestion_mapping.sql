-- Create a new intermediate table to link OverallReview and KnowledgeSuggestion
create sequence "public"."OverallReviewKnowledgeSuggestionMapping_id_seq";

create table "public"."OverallReviewKnowledgeSuggestionMapping" (
    "id" integer not null default nextval('"OverallReviewKnowledgeSuggestionMapping_id_seq"'::regclass),
    "overallReviewId" integer not null,
    "knowledgeSuggestionId" integer not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);

alter sequence "public"."OverallReviewKnowledgeSuggestionMapping_id_seq" owned by "public"."OverallReviewKnowledgeSuggestionMapping"."id";

-- Create indexes
CREATE UNIQUE INDEX "OverallReviewKnowledgeSuggestionMapping_pkey" ON public."OverallReviewKnowledgeSuggestionMapping" USING btree (id);
CREATE UNIQUE INDEX "OverallReviewKnowledgeSuggestionMapping_unique_mapping" ON public."OverallReviewKnowledgeSuggestionMapping" USING btree ("overallReviewId", "knowledgeSuggestionId");

-- Add constraints
alter table "public"."OverallReviewKnowledgeSuggestionMapping" add constraint "OverallReviewKnowledgeSuggestionMapping_pkey" PRIMARY KEY using index "OverallReviewKnowledgeSuggestionMapping_pkey";

alter table "public"."OverallReviewKnowledgeSuggestionMapping" add constraint "OverallReviewKnowledgeSuggestionMapping_overallReviewId_fkey" FOREIGN KEY ("overallReviewId") REFERENCES "OverallReview"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."OverallReviewKnowledgeSuggestionMapping" validate constraint "OverallReviewKnowledgeSuggestionMapping_overallReviewId_fkey";

alter table "public"."OverallReviewKnowledgeSuggestionMapping" add constraint "OverallReviewKnowledgeSuggestionMapping_knowledgeSuggestionId_fkey" FOREIGN KEY ("knowledgeSuggestionId") REFERENCES "KnowledgeSuggestion"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."OverallReviewKnowledgeSuggestionMapping" validate constraint "OverallReviewKnowledgeSuggestionMapping_knowledgeSuggestionId_fkey";

-- Grant permissions
GRANT ALL ON TABLE "public"."OverallReviewKnowledgeSuggestionMapping" TO "anon";
GRANT ALL ON TABLE "public"."OverallReviewKnowledgeSuggestionMapping" TO "authenticated";
GRANT ALL ON TABLE "public"."OverallReviewKnowledgeSuggestionMapping" TO "service_role";

GRANT ALL ON SEQUENCE "public"."OverallReviewKnowledgeSuggestionMapping_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."OverallReviewKnowledgeSuggestionMapping_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."OverallReviewKnowledgeSuggestionMapping_id_seq" TO "service_role";
