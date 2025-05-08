export interface TableGroupsOverride {
  public: {
    Tables: {
      table_groups: {
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
