--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Debian 16.9-1.pgdg130+1)
-- Dumped by pg_dump version 16.9 (Debian 16.9-1.pgdg130+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: default_expiry(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.default_expiry() RETURNS timestamp with time zone
    LANGUAGE sql
    AS $$
  SELECT now() + interval '7 days';
$$;


--
-- Name: default_greeting(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.default_greeting() RETURNS text
    LANGUAGE sql
    AS $$
  SELECT 'Hello from UDF';
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: default_patterns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.default_patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    currency text DEFAULT 'JPY'::text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    price numeric DEFAULT 123.45 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    description text,
    json_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
    random_value double precision DEFAULT random() NOT NULL,
    discount numeric DEFAULT (100 - 10) NOT NULL,
    special_note text DEFAULT 
CASE
    WHEN (EXTRACT(dow FROM now()) = (0)::numeric) THEN 'Sunday'::text
    ELSE 'Not Sunday'::text
END,
    lower_name text DEFAULT lower('DEFAULT_NAME'::text),
    record_time timestamp with time zone DEFAULT statement_timestamp(),
    app_user text DEFAULT CURRENT_USER,
    greeting text DEFAULT public.default_greeting(),
    expiry_date timestamp with time zone DEFAULT public.default_expiry()
);


--
-- Name: default_patterns default_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.default_patterns
    ADD CONSTRAINT default_patterns_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

