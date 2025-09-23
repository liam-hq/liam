-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "default_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency" text DEFAULT 'JPY' NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"price" numeric DEFAULT '123.45' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"json_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{""}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp with time zone DEFAULT (now() + '30 days'::interval),
	"random_value" double precision DEFAULT random() NOT NULL,
	"discount" numeric DEFAULT '(100 - 10)' NOT NULL,
	"special_note" text DEFAULT 
CASE
    WHEN (EXTRACT(dow FROM now()) = (0)::numeric) THEN 'Sunday'::text
    ELSE 'Not Sunday'::text
END,
	"lower_name" text DEFAULT lower('DEFAULT_NAME'::text),
	"record_time" timestamp with time zone DEFAULT statement_timestamp(),
	"app_user" text DEFAULT CURRENT_USER,
	"greeting" text DEFAULT default_greeting(),
	"expiry_date" timestamp with time zone DEFAULT default_expiry()
);

*/