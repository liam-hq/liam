BEGIN;

-- Create message_subscriptions table
CREATE TABLE IF NOT EXISTS "public"."message_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "subscribed_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "unsubscribed_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."message_subscriptions" OWNER TO "postgres";

-- Add primary key constraint
ALTER TABLE ONLY "public"."message_subscriptions"
    ADD CONSTRAINT "message_subscriptions_pkey" PRIMARY KEY ("id");

-- Add unique constraint to prevent duplicate subscriptions
ALTER TABLE ONLY "public"."message_subscriptions"
    ADD CONSTRAINT "message_subscriptions_user_design_session_unique" 
    UNIQUE ("user_id", "design_session_id");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."message_subscriptions"
    ADD CONSTRAINT "message_subscriptions_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."message_subscriptions"
    ADD CONSTRAINT "message_subscriptions_design_session_id_fkey" 
    FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."message_subscriptions"
    ADD CONSTRAINT "message_subscriptions_organization_id_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Create function to automatically set organization_id from design_session
CREATE OR REPLACE FUNCTION "public"."set_message_subscriptions_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."design_sessions" 
    WHERE "id" = NEW.design_session_id
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_message_subscriptions_organization_id"() OWNER TO "postgres";

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_message_subscriptions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_message_subscriptions_updated_at"() OWNER TO "postgres";

-- Create triggers
CREATE TRIGGER "set_message_subscriptions_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."message_subscriptions"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_message_subscriptions_organization_id"();

CREATE TRIGGER "update_message_subscriptions_updated_at_trigger"
  BEFORE UPDATE ON "public"."message_subscriptions"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."update_message_subscriptions_updated_at"();

-- Enable Row Level Security
ALTER TABLE "public"."message_subscriptions" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "authenticated_users_can_select_org_message_subscriptions" 
  ON "public"."message_subscriptions" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_message_subscriptions" 
  ON "public"."message_subscriptions" 
  IS 'Authenticated users can only view message subscriptions belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_own_message_subscriptions" 
  ON "public"."message_subscriptions" 
  FOR INSERT TO "authenticated" 
  WITH CHECK ((
    "user_id" = "auth"."uid"() AND
    "organization_id" IN ( 
      SELECT "organization_members"."organization_id"
      FROM "public"."organization_members"
      WHERE ("organization_members"."user_id" = "auth"."uid"())
    )
  ));

COMMENT ON POLICY "authenticated_users_can_insert_own_message_subscriptions" 
  ON "public"."message_subscriptions" 
  IS 'Authenticated users can only create their own message subscriptions in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_own_message_subscriptions" 
  ON "public"."message_subscriptions" 
  FOR UPDATE TO "authenticated" 
  USING ((
    "user_id" = "auth"."uid"() AND
    "organization_id" IN ( 
      SELECT "organization_members"."organization_id"
      FROM "public"."organization_members"
      WHERE ("organization_members"."user_id" = "auth"."uid"())
    )
  )) 
  WITH CHECK ((
    "user_id" = "auth"."uid"() AND
    "organization_id" IN ( 
      SELECT "organization_members"."organization_id"
      FROM "public"."organization_members"
      WHERE ("organization_members"."user_id" = "auth"."uid"())
    )
  ));

COMMENT ON POLICY "authenticated_users_can_update_own_message_subscriptions" 
  ON "public"."message_subscriptions" 
  IS 'Authenticated users can only update their own message subscriptions in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_own_message_subscriptions" 
  ON "public"."message_subscriptions" 
  FOR DELETE TO "authenticated" 
  USING ((
    "user_id" = "auth"."uid"() AND
    "organization_id" IN ( 
      SELECT "organization_members"."organization_id"
      FROM "public"."organization_members"
      WHERE ("organization_members"."user_id" = "auth"."uid"())
    )
  ));

COMMENT ON POLICY "authenticated_users_can_delete_own_message_subscriptions" 
  ON "public"."message_subscriptions" 
  IS 'Authenticated users can only delete their own message subscriptions in organizations they are members of';

-- Create RLS policies for service role
CREATE POLICY "service_role_can_select_all_message_subscriptions" 
  ON "public"."message_subscriptions" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_message_subscriptions" 
  ON "public"."message_subscriptions" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_message_subscriptions" 
  ON "public"."message_subscriptions" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_message_subscriptions" 
  ON "public"."message_subscriptions" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."message_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."message_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."message_subscriptions" TO "service_role";

GRANT ALL ON FUNCTION "public"."set_message_subscriptions_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_message_subscriptions_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_message_subscriptions_organization_id"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_message_subscriptions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_message_subscriptions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_message_subscriptions_updated_at"() TO "service_role";

-- Create indexes for better performance
CREATE INDEX "idx_message_subscriptions_user_id" ON "public"."message_subscriptions" ("user_id");
CREATE INDEX "idx_message_subscriptions_design_session_id" ON "public"."message_subscriptions" ("design_session_id");
CREATE INDEX "idx_message_subscriptions_organization_id" ON "public"."message_subscriptions" ("organization_id");
CREATE INDEX "idx_message_subscriptions_is_active" ON "public"."message_subscriptions" ("is_active");
CREATE INDEX "idx_message_subscriptions_active_subscriptions" ON "public"."message_subscriptions" ("design_session_id", "is_active") WHERE "is_active" = true;

-- Create helper functions for subscription management

-- Function to subscribe a user to a design session
CREATE OR REPLACE FUNCTION "public"."subscribe_to_design_session"(
  p_design_session_id "uuid"
) RETURNS "json"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_organization_id uuid;
  v_subscription_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get organization_id from design_session
  SELECT organization_id INTO v_organization_id
  FROM design_sessions
  WHERE id = p_design_session_id;
  
  IF v_organization_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Design session not found');
  END IF;
  
  -- Check if user is member of the organization
  IF NOT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = v_user_id AND organization_id = v_organization_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'User not authorized for this organization');
  END IF;
  
  -- Insert or update subscription
  INSERT INTO message_subscriptions (user_id, design_session_id, is_active)
  VALUES (v_user_id, p_design_session_id, true)
  ON CONFLICT (user_id, design_session_id)
  DO UPDATE SET 
    is_active = true,
    subscribed_at = CURRENT_TIMESTAMP,
    unsubscribed_at = NULL,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO v_subscription_id;
  
  RETURN json_build_object(
    'success', true, 
    'subscription_id', v_subscription_id,
    'message', 'Successfully subscribed to design session'
  );
END;
$$;

-- Function to unsubscribe a user from a design session
CREATE OR REPLACE FUNCTION "public"."unsubscribe_from_design_session"(
  p_design_session_id "uuid"
) RETURNS "json"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_rows_affected integer;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Update subscription to inactive
  UPDATE message_subscriptions 
  SET 
    is_active = false,
    unsubscribed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = v_user_id 
    AND design_session_id = p_design_session_id 
    AND is_active = true;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  IF v_rows_affected = 0 THEN
    RETURN json_build_object('success', false, 'error', 'No active subscription found');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully unsubscribed from design session'
  );
END;
$$;

-- Function to get subscribers for a design session
CREATE OR REPLACE FUNCTION "public"."get_design_session_subscribers"(
  p_design_session_id "uuid"
) RETURNS TABLE(
  user_id uuid,
  user_name text,
  user_email text,
  subscribed_at timestamp with time zone
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.user_id,
    u.name as user_name,
    u.email as user_email,
    ms.subscribed_at
  FROM message_subscriptions ms
  JOIN users u ON ms.user_id = u.id
  WHERE ms.design_session_id = p_design_session_id
    AND ms.is_active = true
  ORDER BY ms.subscribed_at ASC;
END;
$$;

-- Grant permissions for helper functions
GRANT ALL ON FUNCTION "public"."subscribe_to_design_session"("uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."subscribe_to_design_session"("uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."subscribe_to_design_session"("uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."unsubscribe_from_design_session"("uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unsubscribe_from_design_session"("uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unsubscribe_from_design_session"("uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_design_session_subscribers"("uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_design_session_subscribers"("uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_design_session_subscribers"("uuid") TO "service_role";

COMMIT;
