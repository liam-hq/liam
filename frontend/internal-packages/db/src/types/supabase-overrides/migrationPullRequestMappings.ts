export interface MigrationPullRequestMappingsOverride {
  public: {
    Tables: {
      migration_pull_request_mappings: {
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
