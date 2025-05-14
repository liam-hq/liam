-- Create schemas table
CREATE TABLE IF NOT EXISTS public.schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Create schema_versions table
CREATE TABLE IF NOT EXISTS public.schema_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES public.schemas(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  patch JSONB,
  reverse_patch JSONB
);

-- Add indexes
CREATE INDEX IF NOT EXISTS schemas_organization_id_idx ON public.schemas(organization_id);
CREATE INDEX IF NOT EXISTS schema_versions_schema_id_idx ON public.schema_versions(schema_id);
CREATE INDEX IF NOT EXISTS schema_versions_number_idx ON public.schema_versions(number);

-- Add RLS policies
ALTER TABLE public.schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_versions ENABLE ROW LEVEL SECURITY;

-- Schemas policies
CREATE POLICY "Users can view schemas in their organizations" ON public.schemas
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert schemas in their organizations" ON public.schemas
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schemas in their organizations" ON public.schemas
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete schemas in their organizations" ON public.schemas
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Schema versions policies
CREATE POLICY "Users can view schema versions in their organizations" ON public.schema_versions
  FOR SELECT
  USING (
    schema_id IN (
      SELECT id FROM public.schemas
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert schema versions in their organizations" ON public.schema_versions
  FOR INSERT
  WITH CHECK (
    schema_id IN (
      SELECT id FROM public.schemas
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update schema versions in their organizations" ON public.schema_versions
  FOR UPDATE
  USING (
    schema_id IN (
      SELECT id FROM public.schemas
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    schema_id IN (
      SELECT id FROM public.schemas
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete schema versions in their organizations" ON public.schema_versions
  FOR DELETE
  USING (
    schema_id IN (
      SELECT id FROM public.schemas
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );
