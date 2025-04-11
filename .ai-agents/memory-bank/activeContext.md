# Active Context

## Current Work Focus

The current focus is on enhancing the Reviewer User experience with AI-driven analysis and suggestions integrated into the migration review process. Key areas of active development include:

1. **Schema Metadata Generation Pipeline**: Improving the pipeline that creates and stores metadata suggestions based on PR reviews.
2. **Schema Change Detection**: Enhancing the detection system to better identify and analyze database migrations.
3. **Review Prompt Template**: Refining the template to provide more detailed and contextual analysis.

## Recent Changes

1. **Switched AI Model from Anthropic to OpenAI**: Changed the AI model used in prompt generators from ChatAnthropic to ChatOpenAI:
   - Updated all three prompt generator files (generateDocsSuggestion, generateReview, generateSchemaMeta) to use ChatOpenAI
   - Changed the model from 'claude-3-7-sonnet-latest' to 'o3-mini-2025-01-31'
   - Created index.ts files for the generateSchemaMeta and generateDocsSuggestion directories
   - Updated the main prompts/index.ts file to export all three prompt generators
   - Updated package.json to replace @langchain/anthropic with @langchain/openai v0.5.5
   - This change standardizes the AI model usage across the application and potentially improves performance and cost-efficiency

2. **Added Reasoning Field to KnowledgeSuggestion**: Enhanced the KnowledgeSuggestion table to store the rationale behind schema metadata update suggestions:
   - Created a migration to add a `reasoning` TEXT field with a default empty string value
   - Updated the database.types.ts file to include the new field in the type definitions
   - Modified the KnowledgeSuggestionDetailPage.tsx component to display the reasoning field when available
   - This enhancement helps users understand the context and rationale behind schema metadata update suggestions, enabling more informed decisions when approving suggestions

2. **OverallReview to KnowledgeSuggestion Relationship**: Implemented a relationship between OverallReview and KnowledgeSuggestion tables:
   - Created a new intermediate table `OverallReviewKnowledgeSuggestionMapping` to link OverallReview and KnowledgeSuggestion
   - Modified `processCreateKnowledgeSuggestion.ts` to accept an optional `overallReviewId` parameter
   - Implemented `createOverallReviewMapping` function to create mappings in the OverallReviewKnowledgeSuggestionMapping table
   - Enhanced the MigrationDetailPage to fetch and display related KnowledgeSuggestions
   - Updated UI to show KnowledgeSuggestions in a dedicated section on the MigrationDetailPage
   - Implemented proper navigation using the urlgen utility for type-safe route generation
   - This allows users to track and navigate to KnowledgeSuggestions from the MigrationDetailPage

2. **Optimized KnowledgeSuggestion Creation**: Enhanced the `processCreateKnowledgeSuggestion.ts` function to avoid creating unnecessary suggestions:
   - Implemented content comparison to check if document content has changed before creating a suggestion
   - Refactored the function into smaller, focused helper functions to reduce cognitive complexity
   - Improved type safety with proper type definitions and return types
   - Optimized database queries by caching the GitHubDocFilePath query result
   - Enhanced error handling with more specific error messages
   - This optimization prevents duplicate suggestions when content hasn't changed

2. **KnowledgeSuggestion and GitHubDocFilePath Integration**: Implemented a connection between KnowledgeSuggestion and GitHubDocFilePath tables:
   - Created a new intermediate table `KnowledgeSuggestionDocMapping` to link KnowledgeSuggestion and GitHubDocFilePath
   - Modified `processCreateKnowledgeSuggestion.ts` to create mappings for existing docs when creating a Doc Suggestion
   - Updated `approveKnowledgeSuggestion.ts` to create GitHubDocFilePath entries and mappings for new docs
   - Refactored code to reduce cognitive complexity and improve type safety
   - This ensures that newly created Knowledge suggestions are properly included in reviews

3. **Database Migration Documentation**: Created comprehensive documentation for the Supabase migration workflow:
   - Added detailed migration guidelines in `docs/migrationOpsContext.md`
   - Documented schema design patterns in `docs/schemaPatterns.md`
   - Added Supabase migration commands to package.json

4. **Supabase Component Implementation**: Implemented Supabase for database access in key components:
   - ProjectBranchesListPage component
   - KnowledgeSuggestionDetailPage component
   - ProjectDetailPage component
   - Implemented proper handling of date fields by converting string dates to Date objects
   - Used nested select syntax for complex relationships between tables
   - Added comprehensive error handling for Supabase queries
   - Handled array-based return format for nested relationships in Supabase

5. **Enhanced Review Generation with PR Context**: Improved the review generation functionality to incorporate deeper context from pull requests:
   - Added `getIssueComments` function to fetch PR comments using the GitHub API
   - Modified `processGenerateReview.ts` to fetch PR description and comments
   - Updated type definitions to use `fileChanges` instead of `schemaChanges` for better clarity
   - Enhanced prompt templates to include PR description and comments sections
   - Updated all related files for consistent terminology

6. **Schema Metadata Generation**: Implemented a new pipeline that creates and stores metadata suggestions based on PR reviews, including:
   - New task (`generateSchemaMetaSuggestionTask`) triggered after a review is saved
   - Processing function (`processGenerateSchemaMeta`) for generating schema metadata suggestions
   - Integration with `createKnowledgeSuggestionTask` to store generated metadata
   - Enhanced prompt with current schema metadata context for more informed suggestions
   - Added schema files content to the AI prompt for better context and more accurate suggestions
   - Created reusable utility function for fetching schema files content
   - Type-safe validation of existing schema metadata using Valibot

7. **Database Schema Optimization**:
   - Removed unused Doc and DocVersion models
   - Renamed `WatchSchemaFilePattern` table to `GitHubSchemaFilePath`
   - Changed from pattern matching to direct path comparison for schema file management

8. **Supabase JS Integration**:
   - Implemented Supabase JS for database access in the document viewer page
   - Created optimized queries using nested joins
   - Developed type-safe implementation with proper handling of bigint fields and nested relationships
   - Standardized Supabase client usage with a shared createClient function
   - Extended Supabase implementation to ProjectBranchesListPage and KnowledgeSuggestionDetailPage components

9. **Document Management**:
   - Implemented text document viewer page at `/app/projects/[projectId]/docs/[branchOrCommit]/[...slug]`
   - Created documentation list page at `/app/projects/[projectId]/ref/[branchOrCommit]/docs`
   - Added dynamic branch name management for KnowledgeSuggestion operations

## Next Steps

1. **Enhance Supabase Implementation**:
   - Implement Supabase RPC for robust transaction management
   - Ensure consistent Supabase type updates with database schema changes

2. **Enhance AI Components**:
   - Improve review prompt template for more detailed analysis
   - Implement continuous learning from past reviews
   - Refine suggestion accuracy and relevance
   - Continue enhancing AI prompts with additional context for better results

3. **Schema Change Detection**:
   - Further enhance detection to better identify relevant migration files
   - Improve analysis of database migrations

4. **Builder User Features**:
   - Begin planning for Builder User features
   - Leverage accumulated review data and feedback

## Active Decisions and Considerations

1. **Database Access Strategy**:
   - Using Supabase for database migrations and access
   - Leveraging Supabase's optimized query capabilities
   - Standardizing the data access layer
   - Handling type compatibility issues, particularly with bigint fields and nested relationships

2. **Testing Approach**:
   - Using direct testing with Supabase instead of mocking
   - Creating real records in the database for testing
   - Running actual functions with test records
   - Cleaning up test data after tests

3. **Transaction Management**:
   - Moving away from manual rollback processing
   - Planning to implement Supabase RPC for transaction management
   - Ensuring consistent approach across the application

4. **Schema File Management**:
   - Using direct path comparison instead of pattern matching
   - Providing more precise and efficient approach
   - Aligning with existing GitHubDocFilePath model

5. **Function Organization**:
   - Breaking down complex functions into smaller, focused helper functions
   - Reducing cognitive complexity by separating concerns
   - Improving maintainability and testability

## Important Patterns and Preferences

1. **Code Implementation**:
   - Use TypeScript for all components and functions
   - Use early returns for readability
   - Use CSS Modules for styling
   - Use descriptive variable and function names
   - Implement accessibility features
   - Use consts instead of functions
   - Create separate components instead of coding in page.tsx
   - Follow tsconfig.json paths settings
   - Align data fetching with component roles
   - Break down complex functions into smaller, focused helper functions

2. **Code Quality Process**:
   - Use `pnpm fmt` to format code according to project standards
   - Use `pnpm lint` to check for code quality issues and type errors
   - Run these commands before committing changes to ensure consistent code quality
   - The formatter uses Biome for JavaScript/TypeScript formatting
   - The linter checks both code style (using Biome) and type correctness (using TypeScript)

3. **Deployment Process**:
   - Use trigger.dev CLI for deploying background jobs
   - Run `npx trigger.dev deploy --dry-run` to verify deployment without applying changes
   - Run `npx trigger.dev deploy` to deploy to production
   - CI/CD pipelines use `pnpm deploy:jobs` command defined in the root package.json

3. **Component Implementation**:
   - Use named exports instead of default exports
   - Prioritize CSS Variables from @liam-hq/ui
   - Prefer UI components from @liam-hq/ui
   - Import icons from @liam-hq/ui

4. **Database Access**:
   - Use type assertions for Supabase types
   - Handle bigint to number conversions
   - Properly type nested relationship data
   - Use optimized queries with nested joins
   - Cache query results when they'll be reused
   - Follow migration guidelines in `docs/migrationOpsContext.md` when creating database migrations
   - Adhere to schema design patterns in `docs/schemaPatterns.md` for consistent database design

5. **Function Organization**:
   - Separate business logic into dedicated function files
   - Call functions from task definitions
   - Chain tasks to form complete workflows
   - Extract reusable logic into helper functions

## Learnings and Project Insights

1. **Supabase Integration**:
   - Supabase provides an efficient migration workflow for schema changes
   - Supabase JS provides optimized queries with nested joins
   - Type compatibility requires careful handling
   - Direct testing approach with real database interactions
   - Proper type validation is essential for data integrity

2. **AI Prompt Engineering**:
   - Providing existing context to AI prompts significantly improves output quality
   - Including actual schema files in prompts enables more accurate and contextually relevant suggestions
   - Type-safe validation of AI inputs and outputs ensures data consistency
   - Incremental improvements are more effective than generating from scratch
   - Reusable utility functions for context gathering improve maintainability

3. **Schema Management**:
   - Direct path comparison is more precise than pattern matching
   - Consistent naming conventions improve code readability
   - Standardized client usage ensures consistent behavior

4. **AI Components**:
   - Review prompt template quality directly impacts analysis quality
   - Continuous learning is essential for improving accuracy
   - Schema metadata generation requires accurate analysis of changes

5. **Document Management**:
   - GitHub integration provides more direct document handling
   - Dynamic branch name management increases flexibility
   - Centralized view of documentation improves user experience

6. **Code Organization**:
   - Breaking down complex functions improves maintainability
   - Proper type definitions enhance code safety
   - Helper functions with clear responsibilities reduce cognitive load
   - Caching query results improves performance
