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

## What's Left to Build

- Enhanced schema change detection to better identify and analyze database migrations.
- Improved review prompt template for more detailed and contextual analysis.
- Further refinement of AI components to enhance the accuracy and relevance of suggestions.
- Development of Builder User features, planned for later phases, leveraging accumulated review data and feedback.
- Exploration of multi-region deployment opportunities as user needs grow.
- Complete migration from Prisma ORM to Supabase JS across all components to standardize database access patterns.

## Current Status

The project is currently focused on enhancing the Reviewer User experience, with AI-driven analysis and suggestions integrated into the migration review process. The initial release prioritizes the Reviewer User, with Builder User features planned for future phases.

The core review pipeline is now operational, connecting GitHub webhooks to AI-powered review generation and PR comment posting. This enables automatic review of database schema changes when pull requests are opened or updated.

The KnowledgeSuggestion feature is being implemented to allow AI-generated suggestions for Schema and Docs updates. The database model has been created, which will store suggestions that can be approved and then committed to GitHub using the GitHub API. Recent improvements include adding a branchName column to the KnowledgeSuggestion table to replace hardcoded branch names with dynamic ones, making the system more flexible and maintainable.

A new text document viewer page has been implemented at `/app/projects/[projectId]/docs/[branchOrCommit]/[...slug]` that fetches and displays raw text content from GitHub repositories. This page uses Supabase JS for database access instead of Prisma, demonstrating the flexibility of our data access layer. The implementation uses a single optimized query with nested joins to efficiently retrieve all necessary data. This serves as a prototype for the planned migration from Prisma to Supabase JS across the entire application.

A documentation list page has been implemented at `/app/projects/[projectId]/ref/[branchOrCommit]/docs` that displays all GitHubDocFilePath entries for a project. The page provides links to individual document pages and shows the review status of each document. This enhances the user experience by providing a centralized view of all documentation files associated with a project.

The database schema has been optimized by removing the unused Doc and DocVersion models. Document management is now fully handled through the GitHubDocFilePath model, which provides a more direct integration with GitHub repositories. This change reflects the project's shift towards tighter GitHub integration and a more streamlined approach to document handling.

## Database Migration Workflow

A standardized workflow has been established for database schema changes:

1. **Schema Modification**: Update the schema.prisma file with the desired changes.
2. **Migration Creation and Application**: 
   ```bash
   pnpm migrate:dev <migration_name>
   ```
   This script creates a Prisma migration, applies it to the database, and generates a corresponding Supabase migration.
3. **Client Generation**: After any migration, always run:
   ```bash
   pnpm gen:prisma    # Generate Prisma client
   pnpm supabase:gen  # Generate Supabase types and run related scripts
   ```

This workflow ensures consistency between the database schema, Prisma client, and Supabase types, maintaining synchronization across all components of the system.

## Known Issues

- The schema change detection is basic and needs enhancement to better identify relevant migration files.
- The review prompt template is simple and could be improved to provide more detailed analysis.
- Continuous learning for AI components is required to improve accuracy and relevance over time.
- The coexistence with the OSS version needs to be managed carefully to ensure a sustainable business model.
