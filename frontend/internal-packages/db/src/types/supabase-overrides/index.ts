import type { MergeDeep } from 'type-fest'
import type { Database as DatabaseGenerated } from '../../../supabase/database.types'
import type { ArtifactsOverride } from './artifacts'
import type { BuildingSchemasOverride } from './buildingSchemas'
import type { DesignSessionsOverride } from './designSessions'
import type { DocFilePathsOverride } from './docFilePaths'
import type { GithubPullRequestCommentsOverride } from './githubPullRequestComments'
import type { GithubPullRequestsOverride } from './githubPullRequests'
import type { KnowledgeSuggestionDocMappingsOverride } from './knowledgeSuggestionDocMappings'
import type { KnowledgeSuggestionsOverride } from './knowledgeSuggestions'
import type { MigrationPullRequestMappingsOverride } from './migrationPullRequestMappings'
import type { MigrationsOverride } from './migrations'
import type { OverallReviewKnowledgeSuggestionMappingsOverride } from './overallReviewKnowledgeSuggestionMappings'
import type { OverallReviewsOverride } from './overallReviews'
import type { ProjectRepositoryMappingsOverride } from './projectRepositoryMappings'
import type { ReviewFeedbackCommentsOverride } from './reviewFeedbackComments'
import type { ReviewFeedbackKnowledgeSuggestionMappingsOverride } from './reviewFeedbackKnowledgeSuggestionMappings'
import type { ReviewFeedbacksOverride } from './reviewFeedbacks'
import type { ReviewSuggestionSnippetsOverride } from './reviewSuggestionSnippets'
import type { SchemaFilePathsOverride } from './schemaFilePaths'
import type { TimelineItemsOverride } from './timelineItems'
import type { ValidationQueriesOverride } from './validationQueries'
import type { ValidationResultsOverride } from './validationResults'

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
