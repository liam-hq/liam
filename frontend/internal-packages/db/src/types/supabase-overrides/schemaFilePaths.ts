export interface SchemaFilePathsOverride {
  public: {
    Tables: {
      schema_file_paths: {
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
