export type ArtifactsOverride = {
  public: {
    Tables: {
      artifacts: {
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
