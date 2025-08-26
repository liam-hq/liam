
BEGIN;

ALTER TABLE public.users 
ADD COLUMN avatar_url TEXT;

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

CREATE OR REPLACE FUNCTION public.handle_user_avatar_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  UPDATE public.users 
  SET avatar_url = NEW.raw_user_meta_data->>'avatar_url'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_updated 
  AFTER UPDATE ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_user_avatar_update();

COMMIT;
