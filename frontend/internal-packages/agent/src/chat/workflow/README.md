# LangGraph Chat Workflow

A **LangGraph implementation** for processing chat messages in the LIAM application, providing structured workflow management.

## Architecture

```mermaid
flowchart TD
    START([START])
    ANALYZE[analyzeRequirements<br/>Requirements Organization<br/><i>pmAgent</i>]
    DESIGN[designSchema<br/>DB Design & DDL Execution<br/><i>dbAgent</i>]
    VALIDATE[validateSchema<br/>Use Case Verification & DML Execution<br/><i>qaAgent</i>]
    REVIEW[reviewDeliverables<br/>Final Requirements & Deliverables Confirmation<br/><i>pmAgentReview</i>]
    FINALIZE[finalizeArtifacts<br/>Generate & Save Artifacts<br/><i>dbAgentArtifactGen</i>]
    END([__end__<br/>End])

    START --> ANALYZE
    ANALYZE --> DESIGN
    DESIGN --> VALIDATE
    VALIDATE -->|success| REVIEW
    VALIDATE -->|dml error or test fail| DESIGN
    REVIEW -->|OK| FINALIZE
    REVIEW -->|NG or issues found| ANALYZE
    FINALIZE --> END

```

## Workflow State

```typescript
interface WorkflowState {
  userInput: string
  generatedAnswer?: string
  finalResponse?: string
  history: string[]
  schemaData: Schema
  projectId?: string
  error?: string
  buildingSchemaId: string
  latestVersionNumber?: number
  organizationId?: string
  userId: string
  designSessionId: string
  repositories: Repositories
}
```

## Key Features

- **Conditional Routing**: Smart error handling with dynamic routing based on state
- **State Management**: Type-safe state transitions with LangGraph's annotation system
- **Error Handling**: Structured error handling with graceful failure paths

## Nodes

1. **analyzeRequirements**: Organizes and clarifies requirements from user input (performed by pmAgent)
2. **designSchema**: Designs database schema and executes DDL statements (performed by dbAgent)
3. **validateSchema**: Verifies use cases and executes DML for testing (performed by qaAgent)
4. **reviewDeliverables**: Performs final confirmation of requirements and deliverables (performed by pmAgentReview)
5. **finalizeArtifacts**: Generates and saves comprehensive artifacts to database (performed by dbAgentArtifactGen)

## Usage

```typescript
import { executeChatWorkflow } from './workflow'

const result = await executeChatWorkflow({
  userInput: 'Create a schema for a fitness tracking app with users, workout plans, exercise logs, and progress charts.',
  history: [],
  schemaData: mySchemaData,
  organizationId: 'my-organization-id',
  buildingSchemaId: 'my-building-schema-id',
  latestVersionNumber: 1,
  userId: 'my-user-id',
  designSessionId: 'my-design-session-id',
  repositories: myRepositories,
})
```
