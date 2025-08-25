export type CheckpointBlobsOverride = {
  public: {
    Tables: {
      checkpoint_blobs: {
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
