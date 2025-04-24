import type { MergeDeep } from 'type-fest'
import type { Database as DatabaseGenerated } from '../../../supabase/database.types'
import type { KnowledgeSuggestionsOverride } from './knowledge_suggestions'
import type { OverallReviewKnowledgeSuggestionMappingsOverride } from './overall_review_knowledge_suggestion_mappings'

export type AppDatabaseOverrides = MergeDeep<
  DatabaseGenerated,
  KnowledgeSuggestionsOverride &
    OverallReviewKnowledgeSuggestionMappingsOverride
>
