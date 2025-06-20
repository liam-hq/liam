export interface ValidationQueriesOverride {
  public: {
    Tables: {
      validation_queries: {
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
