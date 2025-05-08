export interface BranchSchemaOverrideMappingsOverride {
  public: {
    Tables: {
      branch_schema_override_mappings: {
        Insert: {
          organization_id?: string | null
        }
        Update: {
          organization_id?: string | null
        }
      }
    }
  }
}
