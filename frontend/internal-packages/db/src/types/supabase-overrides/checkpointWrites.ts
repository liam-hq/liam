export type CheckpointWritesOverride = {
  public: {
    Tables: {
      checkpoint_writes: {
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
