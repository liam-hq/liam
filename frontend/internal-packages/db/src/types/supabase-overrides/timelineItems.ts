export type TimelineItemsOverride = {
  public: {
    Tables: {
      timeline_items: {
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
