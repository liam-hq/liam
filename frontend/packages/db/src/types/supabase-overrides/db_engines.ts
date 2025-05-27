export interface DbEnginesOverride {
  public: {
    Tables: {
      db_engines: {
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
