# LangGraph Chat Workflow

A **LangGraph implementation** for processing chat messages in the LIAM application, providing structured workflow management.

## Architecture

```mermaid
flowchart TD
    START([START])
    SAVE[saveUserMessage<br/>Save User Input]
    ANALYZE[analyzeRequirements<br/>Requirements Organization<br/><i>pmAnalysisAgent</i>]
    DESIGN[designSchema<br/>DB Design & DDL Execution<br/><i>dbAgent</i>]
    EXECUTE_DDL[executeDDL<br/>DDL Execution<br/><i>agent</i>]
    GENERATE_USECASE[generateUsecase<br/>Use Case Creation<br/><i>qaAgent</i>]
    PREPARE_DML[prepareDML<br/>DML Generation<br/><i>qaAgent</i>]
    VALIDATE[validateSchema<br/>DML Execution & Validation<br/><i>qaAgent</i>]
    REVIEW[reviewDeliverables<br/>Final Requirements & Deliverables Confirmation<br/><i>pmReviewAgent</i>]
    FINALIZE[finalizeArtifacts<br/>Generate & Save Artifacts<br/><i>dbAgentArtifactGen</i>]
    END([__end__<br/>End])

    START --> SAVE
    SAVE -->|no error| ANALYZE
    SAVE -->|error| FINALIZE
    ANALYZE --> DESIGN
    DESIGN -->|no error| EXECUTE_DDL
    DESIGN -->|error| FINALIZE
    EXECUTE_DDL -->|success| GENERATE_USECASE
    EXECUTE_DDL -->|shouldRetryWithDesignSchema| DESIGN
    EXECUTE_DDL -->|ddlExecutionFailed| FINALIZE
    GENERATE_USECASE --> PREPARE_DML
    PREPARE_DML --> VALIDATE
    VALIDATE -->|success| REVIEW
    VALIDATE -->|error| DESIGN
    REVIEW -->|no error| FINALIZE
    REVIEW -->|error| ANALYZE
    FINALIZE --> END

```

## Workflow State

```typescript
interface WorkflowState {
  userInput: string
  generatedAnswer?: string
  finalResponse?: string
  formattedHistory: string
  schemaData: Schema
  error?: Error
  buildingSchemaId: string
  latestVersionNumber: number
  organizationId?: string
  userId: string
  designSessionId: string
  retryCount: Record<string, number>
  shouldRetryWithDesignSchema?: boolean
  ddlExecutionFailed?: boolean
}
```

## Key Features

- **Conditional Routing**: Smart error handling with dynamic routing based on state
- **State Management**: Type-safe state transitions with LangGraph's annotation system
- **Error Handling**: Structured error handling with graceful failure paths
- **Retry Policy**: All nodes are configured with retry policy (maxAttempts: 3)
- **Fallback Mechanism**: Automatic fallback to finalizeArtifacts on critical errors

## Nodes

1. **saveUserMessage**: Saves user input and prepares initial state
2. **analyzeRequirements**: Organizes and clarifies requirements from user input (performed by pmAnalysisAgent)
3. **designSchema**: Designs database schema and executes DDL statements (performed by dbAgent)
4. **executeDDL**: Executes DDL statements (performed by agent)
5. **generateUsecase**: Creates use cases for testing (performed by qaAgent)
6. **prepareDML**: Generates DML statements for testing (performed by qaAgent)
7. **validateSchema**: Executes DML and validates schema (performed by qaAgent)
8. **reviewDeliverables**: Performs final confirmation of requirements and deliverables (performed by pmReviewAgent)
9. **finalizeArtifacts**: Generates and saves comprehensive artifacts to database (performed by dbAgentArtifactGen)

### Conditional Edge Logic

- **saveUserMessage**: Routes to `analyzeRequirements` on success, `finalizeArtifacts` on error
- **designSchema**: Routes to `executeDDL` on success, `finalizeArtifacts` on error
- **executeDDL**: Routes to `generateUsecase` on success, `designSchema` if retry needed, `finalizeArtifacts` if failed
- **validateSchema**: Routes to `reviewDeliverables` on success, `designSchema` on validation error
- **reviewDeliverables**: Routes to `finalizeArtifacts` on success, `analyzeRequirements` if issues found

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
})
```
