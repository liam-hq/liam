-- Make refresh_token nullable to support GitHub setups without user token expiration
alter table if exists public.user_provider_tokens
  alter column refresh_token drop not null;

