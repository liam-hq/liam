export interface ReviewFeedbacksOverride {
  public: {
    Tables: {
      review_feedbacks: {
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
