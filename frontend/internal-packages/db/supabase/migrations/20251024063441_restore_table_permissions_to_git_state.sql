-- Migration: Restore table permissions to match Git state (SSOT)
--
-- Purpose: Fix schema drift by restoring table-level permissions that were
--          manually revoked in production. Git's migration history is the
--          Single Source of Truth (SSOT).
--
-- Context: Production DB had table permissions manually revoked via Dashboard,
--          but Git's initial_squash and subsequent migrations maintain GRANT permissions.
--          This migration restores Git's intended state to production.
--
-- Affected tables: building_schema_versions, building_schemas, checkpoint_blobs,
--                  checkpoint_writes, checkpoints, design_sessions, github_repositories,
--                  invitations, organization_members, organizations,
--                  project_repository_mappings, projects, public_share_settings,
--                  schema_file_paths, users
--
-- Related:
--   - Initial grants: 20250416105745_initial_squash.sql
--   - Issue: liam-hq/liam-internal#5918

begin;

-- Restore permissions for building_schema_versions
grant delete on table "public"."building_schema_versions" to "authenticated";
grant insert on table "public"."building_schema_versions" to "authenticated";
grant references on table "public"."building_schema_versions" to "authenticated";
grant select on table "public"."building_schema_versions" to "authenticated";
grant trigger on table "public"."building_schema_versions" to "authenticated";
grant truncate on table "public"."building_schema_versions" to "authenticated";
grant update on table "public"."building_schema_versions" to "authenticated";
grant delete on table "public"."building_schema_versions" to "service_role";
grant insert on table "public"."building_schema_versions" to "service_role";
grant references on table "public"."building_schema_versions" to "service_role";
grant select on table "public"."building_schema_versions" to "service_role";
grant trigger on table "public"."building_schema_versions" to "service_role";
grant truncate on table "public"."building_schema_versions" to "service_role";
grant update on table "public"."building_schema_versions" to "service_role";

-- Restore permissions for building_schemas
grant delete on table "public"."building_schemas" to "authenticated";
grant insert on table "public"."building_schemas" to "authenticated";
grant references on table "public"."building_schemas" to "authenticated";
grant select on table "public"."building_schemas" to "authenticated";
grant trigger on table "public"."building_schemas" to "authenticated";
grant truncate on table "public"."building_schemas" to "authenticated";
grant update on table "public"."building_schemas" to "authenticated";
grant delete on table "public"."building_schemas" to "service_role";
grant insert on table "public"."building_schemas" to "service_role";
grant references on table "public"."building_schemas" to "service_role";
grant select on table "public"."building_schemas" to "service_role";
grant trigger on table "public"."building_schemas" to "service_role";
grant truncate on table "public"."building_schemas" to "service_role";
grant update on table "public"."building_schemas" to "service_role";

-- Restore permissions for checkpoint_blobs
grant delete on table "public"."checkpoint_blobs" to "authenticated";
grant insert on table "public"."checkpoint_blobs" to "authenticated";
grant references on table "public"."checkpoint_blobs" to "authenticated";
grant select on table "public"."checkpoint_blobs" to "authenticated";
grant trigger on table "public"."checkpoint_blobs" to "authenticated";
grant truncate on table "public"."checkpoint_blobs" to "authenticated";
grant update on table "public"."checkpoint_blobs" to "authenticated";
grant delete on table "public"."checkpoint_blobs" to "service_role";
grant insert on table "public"."checkpoint_blobs" to "service_role";
grant references on table "public"."checkpoint_blobs" to "service_role";
grant select on table "public"."checkpoint_blobs" to "service_role";
grant trigger on table "public"."checkpoint_blobs" to "service_role";
grant truncate on table "public"."checkpoint_blobs" to "service_role";
grant update on table "public"."checkpoint_blobs" to "service_role";

-- Restore permissions for checkpoint_writes
grant delete on table "public"."checkpoint_writes" to "authenticated";
grant insert on table "public"."checkpoint_writes" to "authenticated";
grant references on table "public"."checkpoint_writes" to "authenticated";
grant select on table "public"."checkpoint_writes" to "authenticated";
grant trigger on table "public"."checkpoint_writes" to "authenticated";
grant truncate on table "public"."checkpoint_writes" to "authenticated";
grant update on table "public"."checkpoint_writes" to "authenticated";
grant delete on table "public"."checkpoint_writes" to "service_role";
grant insert on table "public"."checkpoint_writes" to "service_role";
grant references on table "public"."checkpoint_writes" to "service_role";
grant select on table "public"."checkpoint_writes" to "service_role";
grant trigger on table "public"."checkpoint_writes" to "service_role";
grant truncate on table "public"."checkpoint_writes" to "service_role";
grant update on table "public"."checkpoint_writes" to "service_role";

-- Restore permissions for checkpoints
grant delete on table "public"."checkpoints" to "authenticated";
grant insert on table "public"."checkpoints" to "authenticated";
grant references on table "public"."checkpoints" to "authenticated";
grant select on table "public"."checkpoints" to "authenticated";
grant trigger on table "public"."checkpoints" to "authenticated";
grant truncate on table "public"."checkpoints" to "authenticated";
grant update on table "public"."checkpoints" to "authenticated";
grant delete on table "public"."checkpoints" to "service_role";
grant insert on table "public"."checkpoints" to "service_role";
grant references on table "public"."checkpoints" to "service_role";
grant select on table "public"."checkpoints" to "service_role";
grant trigger on table "public"."checkpoints" to "service_role";
grant truncate on table "public"."checkpoints" to "service_role";
grant update on table "public"."checkpoints" to "service_role";

-- Restore permissions for design_sessions
grant delete on table "public"."design_sessions" to "authenticated";
grant insert on table "public"."design_sessions" to "authenticated";
grant references on table "public"."design_sessions" to "authenticated";
grant select on table "public"."design_sessions" to "authenticated";
grant trigger on table "public"."design_sessions" to "authenticated";
grant truncate on table "public"."design_sessions" to "authenticated";
grant update on table "public"."design_sessions" to "authenticated";
grant delete on table "public"."design_sessions" to "service_role";
grant insert on table "public"."design_sessions" to "service_role";
grant references on table "public"."design_sessions" to "service_role";
grant select on table "public"."design_sessions" to "service_role";
grant trigger on table "public"."design_sessions" to "service_role";
grant truncate on table "public"."design_sessions" to "service_role";
grant update on table "public"."design_sessions" to "service_role";

-- Restore permissions for github_repositories
grant delete on table "public"."github_repositories" to "authenticated";
grant insert on table "public"."github_repositories" to "authenticated";
grant references on table "public"."github_repositories" to "authenticated";
grant select on table "public"."github_repositories" to "authenticated";
grant trigger on table "public"."github_repositories" to "authenticated";
grant truncate on table "public"."github_repositories" to "authenticated";
grant update on table "public"."github_repositories" to "authenticated";
grant delete on table "public"."github_repositories" to "service_role";
grant insert on table "public"."github_repositories" to "service_role";
grant references on table "public"."github_repositories" to "service_role";
grant select on table "public"."github_repositories" to "service_role";
grant trigger on table "public"."github_repositories" to "service_role";
grant truncate on table "public"."github_repositories" to "service_role";
grant update on table "public"."github_repositories" to "service_role";

-- Restore permissions for invitations
grant delete on table "public"."invitations" to "authenticated";
grant insert on table "public"."invitations" to "authenticated";
grant references on table "public"."invitations" to "authenticated";
grant select on table "public"."invitations" to "authenticated";
grant trigger on table "public"."invitations" to "authenticated";
grant truncate on table "public"."invitations" to "authenticated";
grant update on table "public"."invitations" to "authenticated";
grant delete on table "public"."invitations" to "service_role";
grant insert on table "public"."invitations" to "service_role";
grant references on table "public"."invitations" to "service_role";
grant select on table "public"."invitations" to "service_role";
grant trigger on table "public"."invitations" to "service_role";
grant truncate on table "public"."invitations" to "service_role";
grant update on table "public"."invitations" to "service_role";

-- Restore permissions for organization_members
grant delete on table "public"."organization_members" to "authenticated";
grant insert on table "public"."organization_members" to "authenticated";
grant references on table "public"."organization_members" to "authenticated";
grant select on table "public"."organization_members" to "authenticated";
grant trigger on table "public"."organization_members" to "authenticated";
grant truncate on table "public"."organization_members" to "authenticated";
grant update on table "public"."organization_members" to "authenticated";
grant delete on table "public"."organization_members" to "service_role";
grant insert on table "public"."organization_members" to "service_role";
grant references on table "public"."organization_members" to "service_role";
grant select on table "public"."organization_members" to "service_role";
grant trigger on table "public"."organization_members" to "service_role";
grant truncate on table "public"."organization_members" to "service_role";
grant update on table "public"."organization_members" to "service_role";

-- Restore permissions for organizations
grant delete on table "public"."organizations" to "authenticated";
grant insert on table "public"."organizations" to "authenticated";
grant references on table "public"."organizations" to "authenticated";
grant select on table "public"."organizations" to "authenticated";
grant trigger on table "public"."organizations" to "authenticated";
grant truncate on table "public"."organizations" to "authenticated";
grant update on table "public"."organizations" to "authenticated";
grant delete on table "public"."organizations" to "service_role";
grant insert on table "public"."organizations" to "service_role";
grant references on table "public"."organizations" to "service_role";
grant select on table "public"."organizations" to "service_role";
grant trigger on table "public"."organizations" to "service_role";
grant truncate on table "public"."organizations" to "service_role";
grant update on table "public"."organizations" to "service_role";

-- Restore permissions for project_repository_mappings
grant delete on table "public"."project_repository_mappings" to "authenticated";
grant insert on table "public"."project_repository_mappings" to "authenticated";
grant references on table "public"."project_repository_mappings" to "authenticated";
grant select on table "public"."project_repository_mappings" to "authenticated";
grant trigger on table "public"."project_repository_mappings" to "authenticated";
grant truncate on table "public"."project_repository_mappings" to "authenticated";
grant update on table "public"."project_repository_mappings" to "authenticated";
grant delete on table "public"."project_repository_mappings" to "service_role";
grant insert on table "public"."project_repository_mappings" to "service_role";
grant references on table "public"."project_repository_mappings" to "service_role";
grant select on table "public"."project_repository_mappings" to "service_role";
grant trigger on table "public"."project_repository_mappings" to "service_role";
grant truncate on table "public"."project_repository_mappings" to "service_role";
grant update on table "public"."project_repository_mappings" to "service_role";

-- Restore permissions for projects
grant delete on table "public"."projects" to "authenticated";
grant insert on table "public"."projects" to "authenticated";
grant references on table "public"."projects" to "authenticated";
grant select on table "public"."projects" to "authenticated";
grant trigger on table "public"."projects" to "authenticated";
grant truncate on table "public"."projects" to "authenticated";
grant update on table "public"."projects" to "authenticated";
grant delete on table "public"."projects" to "service_role";
grant insert on table "public"."projects" to "service_role";
grant references on table "public"."projects" to "service_role";
grant select on table "public"."projects" to "service_role";
grant trigger on table "public"."projects" to "service_role";
grant truncate on table "public"."projects" to "service_role";
grant update on table "public"."projects" to "service_role";

-- Restore permissions for public_share_settings
grant select on table "public"."public_share_settings" to "anon";
grant delete on table "public"."public_share_settings" to "authenticated";
grant insert on table "public"."public_share_settings" to "authenticated";
grant references on table "public"."public_share_settings" to "authenticated";
grant select on table "public"."public_share_settings" to "authenticated";
grant trigger on table "public"."public_share_settings" to "authenticated";
grant truncate on table "public"."public_share_settings" to "authenticated";
grant update on table "public"."public_share_settings" to "authenticated";
grant delete on table "public"."public_share_settings" to "service_role";
grant insert on table "public"."public_share_settings" to "service_role";
grant references on table "public"."public_share_settings" to "service_role";
grant select on table "public"."public_share_settings" to "service_role";
grant trigger on table "public"."public_share_settings" to "service_role";
grant truncate on table "public"."public_share_settings" to "service_role";
grant update on table "public"."public_share_settings" to "service_role";

-- Restore permissions for schema_file_paths
grant delete on table "public"."schema_file_paths" to "authenticated";
grant insert on table "public"."schema_file_paths" to "authenticated";
grant references on table "public"."schema_file_paths" to "authenticated";
grant select on table "public"."schema_file_paths" to "authenticated";
grant trigger on table "public"."schema_file_paths" to "authenticated";
grant truncate on table "public"."schema_file_paths" to "authenticated";
grant update on table "public"."schema_file_paths" to "authenticated";
grant delete on table "public"."schema_file_paths" to "service_role";
grant insert on table "public"."schema_file_paths" to "service_role";
grant references on table "public"."schema_file_paths" to "service_role";
grant select on table "public"."schema_file_paths" to "service_role";
grant trigger on table "public"."schema_file_paths" to "service_role";
grant truncate on table "public"."schema_file_paths" to "service_role";
grant update on table "public"."schema_file_paths" to "service_role";

-- Restore permissions for users
grant delete on table "public"."users" to "authenticated";
grant insert on table "public"."users" to "authenticated";
grant references on table "public"."users" to "authenticated";
grant select on table "public"."users" to "authenticated";
grant trigger on table "public"."users" to "authenticated";
grant truncate on table "public"."users" to "authenticated";
grant update on table "public"."users" to "authenticated";
grant delete on table "public"."users" to "service_role";
grant insert on table "public"."users" to "service_role";
grant references on table "public"."users" to "service_role";
grant select on table "public"."users" to "service_role";
grant trigger on table "public"."users" to "service_role";
grant truncate on table "public"."users" to "service_role";
grant update on table "public"."users" to "service_role";

commit;
