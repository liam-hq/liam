export interface KnowledgeSuggestionDocMappingsOverride {
  public: {
    Tables: {
      knowledge_suggestion_doc_mappings: {
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
