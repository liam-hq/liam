# Schema Editing via AI Chat - Implementation Tasks

> Implementation should be done in: `frontend/apps/app/app/(app)/app/(with-project-and-branch)/projects/[projectId]/ref/[branchOrCommit]/schema-poc/page.tsx`

## 1. Add Chat Interface to Schema Editor (in schema-poc/page.tsx)
- [x] Install Vercel AI SDK and required dependencies
  ```bash
  pnpm add ai @ai-sdk/openai @ai-sdk/react
  ```
- [x] Create Chat components with chat history state
- [x] Implement basic UI with message history and input field
- [x] Position the chat interface on the left side of the schema editor
- [x] Style the chat interface to match the application design

## 2. Implement LLM Integration with Route Handler (connected to schema-poc/page.tsx)
- [x] Create an API route at `/api/chat/schema-edit`
- [x] Set up OpenAI configuration with appropriate model
- [x] Implement streaming response handling
- [x] Add context about the current schema to the prompt
- [x] Create a prompt template that explains the schema structure
- [x] Add error handling for API failures
- [x] Implement rate limiting to prevent abuse (set maxDuration to 30 seconds)
- [ ] Add Langfuse integration for monitoring and analytics: https://langfuse.com/docs/integrations/vercel-ai-sdk
  ```bash
  pnpm add langfuse
  ```
  - [x] Set up Langfuse client configuration with API keys
  - [ ] Implement trace tracking for each chat session
  - [ ] Add generation tracking with metadata for each AI response
  - [ ] Implement score tracking for model evaluation

## 3. Process AI Responses to Modify Schema (update handleModifySchema in schema-poc/page.tsx)
- [x] Create a schema modification parser to extract commands from AI responses
- [x] Implement a command interpreter that converts natural language to schema operations
- [x] Extend handleModifySchema to support different operation types
- [x] Add validation to prevent invalid schema modifications
- [x] Add visual feedback when schema is modified

## 4. Enhance User Experience (improve UI in schema-poc/page.tsx)
- [x] Add loading states during AI processing
- [x] Apply ReactMarkdown to user chat messages in `frontend/apps/app/features/schemas/components/SchemaChat/ChatMessage.tsx` for consistent rendering of markdown content

## 5. Manual Schema Application Feature
- [x] Modify `SchemaChat.tsx` to disable automatic schema application on message completion
- [x] Detect and identify JSON code blocks in AI responses
- [x] Add "Apply" button next to JSON code blocks
- [x] Implement click handler for Apply button to process schema modifications
- [x] Style the Apply button to match the application design
- [x] Add success/error notifications when applying schema changes manually
