export interface MigrationsOverride {
  public: {
    Tables: {
      migrations: {
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
