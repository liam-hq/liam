export interface ReviewSuggestionSnippetsOverride {
  public: {
    Tables: {
      review_suggestion_snippets: {
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
