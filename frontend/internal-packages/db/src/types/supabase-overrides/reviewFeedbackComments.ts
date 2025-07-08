export interface ReviewFeedbackCommentsOverride {
  public: {
    Tables: {
      review_feedback_comments: {
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
