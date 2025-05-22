export interface DesignSessionsOverride {
  public: {
    Tables: {
      design_sessions: {
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
