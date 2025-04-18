BEGIN;

ALTER TABLE public.membership_invites RENAME TO invitations;

-- Rename Primary Key Constraint
ALTER TABLE public.invitations RENAME CONSTRAINT membership_invites_pkey TO invitations_pkey;

-- Rename Foreign Key Constraints
ALTER TABLE public.invitations RENAME CONSTRAINT membership_invites_invite_by_user_id_fkey TO invitations_invite_by_user_id_fkey;
ALTER TABLE public.invitations RENAME CONSTRAINT membership_invites_organization_id_fkey TO invitations_organization_id_fkey;

-- Rename Indexes
ALTER INDEX public.membership_invites_email_idx RENAME TO invitations_email_idx;
ALTER INDEX public.membership_invites_org_id_idx RENAME TO invitations_organization_id_idx;

COMMIT;
