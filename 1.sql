CREATE FUNCTION default_greeting()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'Hello from UDF';
$$;


CREATE FUNCTION default_expiry()
RETURNS timestamptz
LANGUAGE sql
AS $$
  SELECT now() + interval '7 days';
$$;


CREATE TABLE default_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- リテラル
  currency text NOT NULL DEFAULT 'JPY',
  quantity integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 123.45,
  is_active boolean NOT NULL DEFAULT true,
  description text DEFAULT NULL,

  -- Cast
  json_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}'::text[],

  -- 関数
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT current_timestamp,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  random_value double precision NOT NULL DEFAULT random(),

  -- 式
  discount numeric NOT NULL DEFAULT (100 - 10),
  special_note text DEFAULT (
    CASE WHEN extract(dow FROM now()) = 0
         THEN 'Sunday'
         ELSE 'Not Sunday'
    END
  ),
  lower_name text DEFAULT lower('DEFAULT_NAME'),

  -- システム値
  record_time timestamptz DEFAULT statement_timestamp(),
  app_user text DEFAULT current_user,

  -- ユーザー定義関数
  greeting text DEFAULT default_greeting(),
  expiry_date timestamptz DEFAULT default_expiry()
);
