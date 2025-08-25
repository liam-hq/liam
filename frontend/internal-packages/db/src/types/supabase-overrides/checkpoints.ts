export type CheckpointsOverride = {
  public: {
    Tables: {
      checkpoints: {
        Insert: {
          id?: string
          organization_id?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
        }
      }
    }
  }
}
