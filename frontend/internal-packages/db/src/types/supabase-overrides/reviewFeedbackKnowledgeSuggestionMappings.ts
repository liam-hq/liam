export interface ReviewFeedbackKnowledgeSuggestionMappingsOverride {
  public: {
    Tables: {
      review_feedback_knowledge_suggestion_mappings: {
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
