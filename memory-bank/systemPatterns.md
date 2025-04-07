# System Patterns

## System Architecture
Liam Migration is designed to integrate seamlessly with existing development workflows, particularly through its GitHub App integration. It leverages AI components to provide intelligent analysis and suggestions during the migration review process.

The project uses a monorepo structure managed with pnpm workspaces, allowing for maintenance of multiple packages and applications in a single repository while sharing dependencies and code.

## Key Technical Decisions
- **AI-Driven Analysis**: The use of AI to automatically analyze migration impacts, predict risks, and suggest optimizations is central to the product's value proposition.
- **GitHub Integration**: The integration with GitHub repositories allows for automated comments and review approvals, streamlining the development process.
- **OSS and Paid Plan Coexistence**: The product is designed to coexist with its OSS version, offering high-value features in paid plans to ensure a sustainable business model.
- **Monorepo Structure**: The decision to use a monorepo structure with pnpm workspaces enables efficient code sharing and dependency management.
- **TypeScript-First**: All components and functions are written in TypeScript to ensure type safety and improve developer experience.
- **Database Access Strategy**: Transitioning from Prisma ORM to Supabase JS for database access to leverage Supabase's optimized query capabilities and standardize the data access layer. This transition requires careful handling of type compatibility issues, particularly with bigint fields and nested relationships.
- **Type Safety Approach**: When working with Supabase, we use type assertions carefully to bridge the gap between the Supabase types and our application's expected types, particularly for nested queries and bigint fields.
- **Schema File Management Strategy**: Using direct path comparison instead of pattern matching for schema file detection, with the GitHubSchemaFilePath table (renamed from WatchSchemaFilePattern) to store exact file paths.
- **Standardized Supabase Client Usage**: Using a shared createClient function across the codebase to ensure consistent Supabase client creation and usage.

## Design Patterns
- **Modular Architecture**: The system is built with a modular architecture to allow for easy integration and extension of features.
- **Function Separation**: Business logic is separated into dedicated function files that are called from task definitions, making the code more modular and testable.
- **Task Pipeline**: A series of tasks are chained together to form a complete workflow, with each task responsible for a specific part of the process.
- **Continuous Learning**: The AI components are designed to continuously learn from past reviews to improve accuracy and relevance over time.
- **Component-Based UI**: The UI is built using a component-based approach with React, promoting reusability and maintainability.
- **Server-Client Separation**: Clear separation of server and client components in Next.js, with appropriate data fetching responsibilities.
- **Flexible Data Access**: The system currently supports multiple database access methods (Prisma ORM and Supabase JS) to provide flexibility in how data is retrieved and manipulated. Supabase JS implementation uses optimized queries with nested joins for efficient data retrieval. The long-term plan is to standardize on Supabase JS across all components.
- **Type-Safe Database Access**: When using Supabase, we implement type-safe queries by using type assertions to bridge the gap between Supabase's types and our application's expected types. This includes handling bigint to number conversions and properly typing nested relationship data.
- **Transaction Management**: Moving away from manual rollback processing in server actions to a more robust approach using Supabase RPC for transaction management. This will provide a consistent and reliable way to handle database transactions across the application.
- **Direct Path Comparison**: Using direct path comparison instead of pattern matching for schema file detection, providing a more precise and efficient approach to schema file management.
- **Consistent Naming Conventions**: Using consistent naming conventions across the codebase, such as GitHubSchemaFilePath and GitHubDocFilePath for GitHub-integrated file management.

## Component Relationships
- **GitHub Webhook Handler**: Receives webhook events from GitHub, extracts schema changes, and triggers the review process.
- **Task Pipeline**: A series of tasks (savePullRequestTask → generateReviewTask → saveReviewTask → postCommentTask → generateDocsSuggestionTask/generateSchemaMetaSuggestionTask → createKnowledgeSuggestionTask) that process the schema changes, generate reviews, and create knowledge suggestions.
- **Review Agent**: Works closely with the GitHub App to provide real-time analysis and feedback on migration changes.
- **Migration Review Page**: Serves as the central interface for users to review detailed migration changes, AI suggestions, and improvement points.
- **Interactive Knowledge Base**: Links review comments with ER diagrams to enhance contextual understanding and formalize best practices.
- **Document Viewer**: Renders raw text content from GitHub repositories, providing a simple way to view documentation and other text files.
- **Schema Metadata Generator**: Analyzes PR reviews and schema changes to generate metadata enhancements that improve the database structure without changing the core schema.

## Repository Structure
The project follows a structured organization with clear separation of concerns:

- **Apps**: Contains the main web applications (app, docs, erd-sample, migration-web)
- **Packages**: Shared libraries and tools (cli, configs, db-structure, erd-core, ui)

Each package has specific responsibilities and is designed to be modular and focused on specific functionality.
