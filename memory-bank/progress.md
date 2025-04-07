# Progress

## What Works

- AI components have been successfully integrated to analyze migration impacts and provide intelligent suggestions.
- The product is deployed in the AWS us-east-1 region, supporting English-speaking markets.
- The GitHub App integration is operational, automating comments and review approvals on PRs.
- Complete review pipeline from GitHub webhook to AI review generation to PR comment posting.
- Modular architecture with separate functions for review generation and comment posting.
- KnowledgeSuggestion database model for storing and managing AI-generated suggestions for Schema and Docs updates.
- Text document viewer page that renders raw text content from GitHub repositories.
- Documentation list page that displays all GitHubDocFilePath entries for a project with links to individual document pages.
- Supabase JS integration for database access in the document viewer page, with optimized queries using nested joins.
- Dynamic branch name management for KnowledgeSuggestion operations, replacing hardcoded branch names.
- Streamlined database schema with removal of unused Doc and DocVersion models, focusing on GitHub-integrated document management.
- Schema metadata generation pipeline that creates and stores metadata suggestions based on PR reviews.
- Type-safe implementation of Supabase queries with proper handling of bigint fields and nested relationships.
- Improved schema file management with the GitHubSchemaFilePath table (renamed from WatchSchemaFilePattern) and direct path comparison instead of pattern matching.
- Standardized Supabase client usage across the codebase using a shared createClient function.

## What's Left to Build

- Further enhancement of schema change detection to better identify and analyze database migrations.
- Improved review prompt template for more detailed and contextual analysis.
- Further refinement of AI components to enhance the accuracy and relevance of suggestions.
- Development of Builder User features, planned for later phases, leveraging accumulated review data and feedback.
- Exploration of multi-region deployment opportunities as user needs grow.
- Complete migration from Prisma ORM to Supabase JS across all components to standardize database access patterns.
- Ensure consistent Supabase type updates whenever database schema changes are made.

## Current Status

The project is currently focused on enhancing the Reviewer User experience, with AI-driven analysis and suggestions integrated into the migration review process. The initial release prioritizes the Reviewer User, with Builder User features planned for future phases.

The core review pipeline is now operational, connecting GitHub webhooks to AI-powered review generation and PR comment posting. This enables automatic review of database schema changes when pull requests are opened or updated.

The KnowledgeSuggestion feature is being implemented to allow AI-generated suggestions for Schema and Docs updates. The database model has been created, which will store suggestions that can be approved and then committed to GitHub using the GitHub API. Recent improvements include adding a branchName column to the KnowledgeSuggestion table to replace hardcoded branch names with dynamic ones, making the system more flexible and maintainable.

A new text document viewer page has been implemented at `/app/projects/[projectId]/docs/[branchOrCommit]/[...slug]` that fetches and displays raw text content from GitHub repositories. This page uses Supabase JS for database access instead of Prisma, demonstrating the flexibility of our data access layer. The implementation uses a single optimized query with nested joins to efficiently retrieve all necessary data. This serves as a prototype for the planned migration from Prisma to Supabase JS across the entire application.

A documentation list page has been implemented at `/app/projects/[projectId]/ref/[branchOrCommit]/docs` that displays all GitHubDocFilePath entries for a project. The page provides links to individual document pages and shows the review status of each document. This enhances the user experience by providing a centralized view of all documentation files associated with a project.

The database schema has been optimized by removing the unused Doc and DocVersion models. Document management is now fully handled through the GitHubDocFilePath model, which provides a more direct integration with GitHub repositories. This change reflects the project's shift towards tighter GitHub integration and a more streamlined approach to document handling.

A new schema metadata generation pipeline has been implemented that creates and stores metadata suggestions based on PR reviews. This pipeline includes a new task (`generateSchemaMetaSuggestionTask`) that is triggered after a review is saved, a processing function (`processGenerateSchemaMeta`) that fetches data from the database and generates schema metadata suggestions, and integration with the existing `createKnowledgeSuggestionTask` to store the generated metadata. The implementation includes proper type handling for Supabase queries, addressing challenges with bigint fields and nested relationships.

As part of the transition to Supabase JS, manual rollback processing has been removed from the `addProject.ts` server action. This change prepares the way for implementing more robust transaction management using Supabase RPC in the future, which will provide a more consistent approach to handling database transactions across the application.

The testing approach has been updated to use a direct testing strategy with Supabase. Instead of mocking the Supabase client or creating mock implementations of functions (as was necessary with Prisma), we now create real records in the database, run the actual functions with these records, and then clean up the test data afterwards. This approach provides more realistic tests that verify the actual functions with real database interactions, leveraging Supabase's ability to be executed directly in test environments. This approach differs significantly from the Prisma approach, which typically required extensive mocking.

The schema file management has been improved by renaming the `WatchSchemaFilePattern` table to `GitHubSchemaFilePath` and changing from pattern matching to direct path comparison. This provides a more precise and efficient approach to schema file management, aligning with the existing `GitHubDocFilePath` model and providing a more consistent approach to file path handling across the application. The implementation includes a migration file that handles the table rename and data transfer, updates to all affected components to use the new table name and field names, and standardization of Supabase client usage across the codebase.

## Known Issues

- The schema change detection has been improved with direct path comparison but still needs further enhancement to better identify relevant migration files.
- The review prompt template is simple and could be improved to provide more detailed analysis.
- Continuous learning for AI components is required to improve accuracy and relevance over time.
- The coexistence with the OSS version needs to be managed carefully to ensure a sustainable business model.
- Type compatibility issues between Prisma and Supabase require careful handling, particularly for bigint fields and nested relationships.
- The transition from Prisma to Supabase JS is ongoing and requires consistent patterns for database access across the application.
- Supabase types need to be updated whenever database schema changes are made, to maintain type safety across the application.
