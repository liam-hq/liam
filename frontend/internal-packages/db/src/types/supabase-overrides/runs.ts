export type RunsOverride = {
  public: {
    Tables: {
      runs: {
        Insert: {
          organization_id?: string
        }
        Update: {
          organization_id?: string
        }
      }
    }
  }
}
