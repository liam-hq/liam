-- Create pgtap extension if it doesn't exist
create extension if not exists pgtap with schema extensions;

-- Create tests schema
CREATE SCHEMA IF NOT EXISTS tests;

-- Drop existing functions to avoid parameter name change errors
DROP FUNCTION IF EXISTS tests.create_supabase_user(text, text, jsonb);
DROP FUNCTION IF EXISTS tests.get_supabase_uid(text);

-- Create test user function with upsert logic
CREATE FUNCTION tests.create_supabase_user(
    p_email text,
    p_name text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Check if user already exists in auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = p_email LIMIT 1;
    
    IF user_id IS NULL THEN
        -- Create new user if not exists
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            p_email,
            '$2a$10$Ht.3/NM5XGZnvtjP/X.YyeS0/QUJp.O6vQbGPT4WrCeY9fFIFVQQu', -- 'password123'
            now(),
            NULL,
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            CASE WHEN p_name IS NULL THEN '{}' ELSE jsonb_build_object('name', p_name) END || p_metadata,
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO user_id;
        
        -- Try to insert into public.users table, ignore if already exists
        BEGIN
            INSERT INTO public.users (id, email, name)
            VALUES (user_id, p_email, COALESCE(p_name, p_email));
        EXCEPTION WHEN unique_violation THEN
            -- User already exists in public.users, do nothing
        END;
    END IF;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Get user ID function
CREATE OR REPLACE FUNCTION tests.get_supabase_uid(email text) RETURNS uuid AS $$
DECLARE
    user_id uuid;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE auth.users.email = $1 LIMIT 1;
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;
