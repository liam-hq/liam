revoke delete on table "public"."Doc" from "anon";

revoke insert on table "public"."Doc" from "anon";

revoke references on table "public"."Doc" from "anon";

revoke select on table "public"."Doc" from "anon";

revoke trigger on table "public"."Doc" from "anon";

revoke truncate on table "public"."Doc" from "anon";

revoke update on table "public"."Doc" from "anon";

revoke delete on table "public"."Doc" from "authenticated";

revoke insert on table "public"."Doc" from "authenticated";

revoke references on table "public"."Doc" from "authenticated";

revoke select on table "public"."Doc" from "authenticated";

revoke trigger on table "public"."Doc" from "authenticated";

revoke truncate on table "public"."Doc" from "authenticated";

revoke update on table "public"."Doc" from "authenticated";

revoke delete on table "public"."Doc" from "service_role";

revoke insert on table "public"."Doc" from "service_role";

revoke references on table "public"."Doc" from "service_role";

revoke select on table "public"."Doc" from "service_role";

revoke trigger on table "public"."Doc" from "service_role";

revoke truncate on table "public"."Doc" from "service_role";

revoke update on table "public"."Doc" from "service_role";

revoke delete on table "public"."DocVersion" from "anon";

revoke insert on table "public"."DocVersion" from "anon";

revoke references on table "public"."DocVersion" from "anon";

revoke select on table "public"."DocVersion" from "anon";

revoke trigger on table "public"."DocVersion" from "anon";

revoke truncate on table "public"."DocVersion" from "anon";

revoke update on table "public"."DocVersion" from "anon";

revoke delete on table "public"."DocVersion" from "authenticated";

revoke insert on table "public"."DocVersion" from "authenticated";

revoke references on table "public"."DocVersion" from "authenticated";

revoke select on table "public"."DocVersion" from "authenticated";

revoke trigger on table "public"."DocVersion" from "authenticated";

revoke truncate on table "public"."DocVersion" from "authenticated";

revoke update on table "public"."DocVersion" from "authenticated";

revoke delete on table "public"."DocVersion" from "service_role";

revoke insert on table "public"."DocVersion" from "service_role";

revoke references on table "public"."DocVersion" from "service_role";

revoke select on table "public"."DocVersion" from "service_role";

revoke trigger on table "public"."DocVersion" from "service_role";

revoke truncate on table "public"."DocVersion" from "service_role";

revoke update on table "public"."DocVersion" from "service_role";

alter table "public"."DocVersion" add column "title" text not null;


