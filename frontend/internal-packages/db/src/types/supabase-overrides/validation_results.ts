export interface ValidationResultsOverride {
  public: {
    Tables: {
      validation_results: {
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
