export interface ProjectRepositoryMappingsOverride {
  public: {
    Tables: {
      project_repository_mappings: {
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
