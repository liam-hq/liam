BEGIN;

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create a new function that syncs both name and avatar_url
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  UPDATE public.users 
  SET 
    name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Update the handle_new_user function to be consistent
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create the trigger with the new function
CREATE TRIGGER on_auth_user_updated 
  AFTER UPDATE ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_user_metadata_update();

-- Drop the old avatar-only update function
DROP FUNCTION IF EXISTS public.handle_user_avatar_update();

COMMIT;