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

## 3. Process AI Responses to Modify Schema (update handleModifySchema in schema-poc/page.tsx)
- [ ] Create a schema modification parser to extract commands from AI responses
- [ ] Implement a command interpreter that converts natural language to schema operations
- [ ] Define a set of supported operations (add table, modify column, etc.)
- [ ] Extend handleModifySchema to support different operation types
- [ ] Add validation to prevent invalid schema modifications
- [ ] Implement undo/redo functionality for schema changes
- [ ] Add visual feedback when schema is modified

## 4. Enhance User Experience (improve UI in schema-poc/page.tsx)
- [ ] Add loading states during AI processing
- [ ] Implement syntax highlighting for schema-related terms in chat
- [ ] Add tooltips explaining available commands
- [ ] Create example prompts for common schema modifications
- [ ] Implement error messages for unsupported operations
- [ ] Add confirmation for destructive schema changes
- [ ] Create documentation for the AI chat feature
