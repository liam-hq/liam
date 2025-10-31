export type RunEventsOverride = {
  public: {
    Tables: {
      run_events: {
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
