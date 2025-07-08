export interface DocFilePathsOverride {
  public: {
    Tables: {
      doc_file_paths: {
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
