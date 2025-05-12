export interface TableOverridesOverride {
  public: {
    Tables: {
      table_overrides: {
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
