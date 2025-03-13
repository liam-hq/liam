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

## Design Patterns
- **Modular Architecture**: The system is built with a modular architecture to allow for easy integration and extension of features.
- **Function Separation**: Business logic is separated into dedicated function files that are called from task definitions, making the code more modular and testable.
- **Task Pipeline**: A series of tasks are chained together to form a complete workflow, with each task responsible for a specific part of the process.
- **Continuous Learning**: The AI components are designed to continuously learn from past reviews to improve accuracy and relevance over time.
- **Component-Based UI**: The UI is built using a component-based approach with React, promoting reusability and maintainability.
- **Server-Client Separation**: Clear separation of server and client components in Next.js, with appropriate data fetching responsibilities.

## Component Relationships
- **GitHub Webhook Handler**: Receives webhook events from GitHub, extracts schema changes, and triggers the review process.
- **Task Pipeline**: A series of tasks (savePullRequestTask → generateReviewTask → saveReviewTask → postCommentTask) that process the schema changes and generate reviews.
- **Review Agent**: Works closely with the GitHub App to provide real-time analysis and feedback on migration changes.
- **Migration Review Page**: Serves as the central interface for users to review detailed migration changes, AI suggestions, and improvement points.
- **Interactive Knowledge Base**: Links review comments with ER diagrams to enhance contextual understanding and formalize best practices.

## Repository Structure
The project follows a structured organization with clear separation of concerns:

- **Apps**: Contains the main web applications (app, docs, erd-sample, migration-web)
- **Packages**: Shared libraries and tools (cli, configs, db-structure, erd-core, ui)

Each package has specific responsibilities and is designed to be modular and focused on specific functionality.
