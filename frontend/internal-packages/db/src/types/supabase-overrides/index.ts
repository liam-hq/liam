import type { MergeDeep } from 'type-fest'
import type { Database as DatabaseGenerated } from '../../../supabase/database.types'
import type { ArtifactsOverride } from './artifacts'
import type { BuildingSchemasOverride } from './building_schemas'
import type { DesignSessionsOverride } from './design_sessions'
import type { DocFilePathsOverride } from './doc_file_paths'
import type { GithubPullRequestCommentsOverride } from './github_pull_request_comments'
import type { GithubPullRequestsOverride } from './github_pull_requests'
import type { KnowledgeSuggestionDocMappingsOverride } from './knowledge_suggestion_doc_mappings'
import type { KnowledgeSuggestionsOverride } from './knowledge_suggestions'
import type { MigrationPullRequestMappingsOverride } from './migration_pull_request_mappings'
import type { MigrationsOverride } from './migrations'
import type { OverallReviewKnowledgeSuggestionMappingsOverride } from './overall_review_knowledge_suggestion_mappings'
import type { OverallReviewsOverride } from './overall_reviews'
import type { ProjectRepositoryMappingsOverride } from './project_repository_mappings'
import type { ReviewFeedbackCommentsOverride } from './review_feedback_comments'
import type { ReviewFeedbackKnowledgeSuggestionMappingsOverride } from './review_feedback_knowledge_suggestion_mappings'
import type { ReviewFeedbacksOverride } from './review_feedbacks'
import type { ReviewSuggestionSnippetsOverride } from './review_suggestion_snippets'
import type { SchemaFilePathsOverride } from './schema_file_paths'
import type { TimelineItemsOverride } from './timeline_items'
import type { ValidationQueriesOverride } from './validation_queries'
import type { ValidationResultsOverride } from './validation_results'

export type AppDatabaseOverrides = MergeDeep<
  DatabaseGenerated,
  KnowledgeSuggestionsOverride &
    KnowledgeSuggestionDocMappingsOverride &
    ReviewFeedbackKnowledgeSuggestionMappingsOverride &
    OverallReviewKnowledgeSuggestionMappingsOverride &
    OverallReviewsOverride &
    ReviewFeedbacksOverride &
    ReviewFeedbackCommentsOverride &
    ReviewSuggestionSnippetsOverride &
    GithubPullRequestsOverride &
    MigrationPullRequestMappingsOverride &
    GithubPullRequestCommentsOverride &
    OverallReviewKnowledgeSuggestionMappingsOverride &
    SchemaFilePathsOverride &
    DocFilePathsOverride &
    ProjectRepositoryMappingsOverride &
    MigrationsOverride &
    GithubPullRequestsOverride &
    DesignSessionsOverride &
    BuildingSchemasOverride &
    ValidationQueriesOverride &
    ValidationResultsOverride &
    TimelineItemsOverride &
    ArtifactsOverride
>
