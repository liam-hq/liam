export interface OverallReviewsOverride {
  public: {
    Tables: {
      overall_reviews: {
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
