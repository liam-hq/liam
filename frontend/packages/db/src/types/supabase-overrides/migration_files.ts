export interface MigrationFilesOverride {
  public: {
    Tables: {
      migration_files: {
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
