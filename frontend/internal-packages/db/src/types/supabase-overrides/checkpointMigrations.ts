export type CheckpointMigrationsOverride = {
  public: {
    Tables: {
      checkpoint_migrations: {
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
