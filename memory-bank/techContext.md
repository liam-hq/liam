# Technical Context

## Technologies Used
- **AI Components**: Utilized for analyzing migration impacts and providing intelligent suggestions.
- **LangChain**: Framework for developing applications powered by language models, used for AI review generation.
- **OpenAI**: Provider of AI models used for generating schema reviews.
- **Trigger.dev**: Task orchestration platform used for implementing the review pipeline.
- **GitHub App**: Integrated to automate comments and review approvals on PRs.
- **Prisma**: ORM for database access and management.
- **AWS**: Deployed in the us-east-1 region for its high affinity with English-speaking markets and potential for future multi-region expansion.
- **TypeScript**: Strongly-typed programming language that builds on JavaScript.
- **React 18**: UI library for building component-based interfaces.
- **Next.js 15**: React framework for server-rendered applications.
- **Vite**: Build tool used in CLI for static site generation.
- **Valtio**: State management.
- **@xyflow/react (React Flow)**: Diagram visualization.
- **Fumadocs**: Documentation site.
- **CSS Modules**: For styling HTML elements with typed definitions.
- **Radix UI**: For UI primitives.
- **Lucide React**: For consistent iconography.

## Development Setup
- The product is integrated with existing development workflows through its GitHub App, allowing for seamless automation and review processes.
- The system is designed to be modular, enabling easy integration and extension of features.
- **Task Pipeline**: A series of tasks are chained together using Trigger.dev to form a complete review workflow.
- **Function Separation**: Business logic is separated into dedicated function files that are called from task definitions.
- **Package Management**: pnpm for efficient dependency management.
- **Monorepo Management**: pnpm workspaces.
- **Build System**: Turborepo for optimized builds.
- **Linting & Formatting**: Biome for code quality.
- **Testing**: Vitest for unit testing, Playwright for e2e testing.

## Code Implementation Guidelines
- Use TypeScript for all components and functions.
- Use early returns whenever possible to make the code more readable.
- Always use CSS Modules for styling HTML elements.
- Use descriptive variable and function/const names. Event functions should be named with a "handle" prefix.
- Implement accessibility features on elements.
- Use consts instead of functions (e.g., "const toggle = () =>") and define types when possible.
- Do not code within the `page.tsx` file in Next.js App Router. Instead, create a separate `XXXPage` component.
- Follow the `tsconfig.json` paths settings and always use the correct alias for import paths.
- Align data fetching responsibilities with the component's role (server vs. client-side).

## Component Implementation Guidelines
- Avoid using `default export`; always use `named export`.
- When styling, prioritize using CSS Variables from the `@liam-hq/ui` package.
- Prefer using UI components provided by `@liam-hq/ui` over custom implementations.
- When using icons, always import them from `@liam-hq/ui`.

## Technical Constraints
- The product must coexist with its OSS version, offering high-value features in paid plans to ensure a sustainable business model.
- The AI components require continuous learning from past reviews to improve accuracy and relevance over time.

## Dependencies
- **AWS**: Used for deployment, with a focus on the us-east-1 region.
- **GitHub**: Essential for integration and automation of review processes.
- **AI Services**: Required for the intelligent analysis and suggestion features.
- **Vercel**: Deployment of web applications.
- **GitHub Actions**: CI/CD for continuous integration.
