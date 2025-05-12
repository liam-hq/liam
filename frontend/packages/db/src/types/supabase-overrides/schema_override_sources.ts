export interface SchemaOverrideSourcesOverride {
  public: {
    Tables: {
      schema_override_sources: {
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
