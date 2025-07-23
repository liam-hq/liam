# LangGraph Chat Workflow

A **LangGraph implementation** for processing chat messages in the LIAM application, providing structured workflow management.

## Architecture

```mermaid
flowchart TD
    START([START])
    WEBSEARCH[webSearch<br/>Initial Research<br/><i>pmAgent</i>]
    ANALYZE[analyzeRequirements<br/>Requirements Organization<br/><i>pmAnalysisAgent</i>]
    DESIGN[designSchema<br/>DB Design & DDL Execution<br/><i>dbAgent</i>]
    EXECUTE_DDL[executeDDL<br/>DDL Execution<br/><i>agent</i>]
    GENERATE_USECASE[generateUsecase<br/>Use Case Creation<br/><i>qaAgent</i>]
    PREPARE_DML[prepareDML<br/>DML Generation<br/><i>qaAgent</i>]
    VALIDATE[validateSchema<br/>DML Execution & Validation<br/><i>qaAgent</i>]
    REVIEW[reviewDeliverables<br/>Final Requirements & Deliverables Confirmation<br/><i>pmReviewAgent</i>]
    FINALIZE[finalizeArtifacts<br/>Generate & Save Artifacts<br/><i>dbAgentArtifactGen</i>]
    END([__end__<br/>End])

    START --> WEBSEARCH
    WEBSEARCH --> ANALYZE
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
  userInput: string;
  messages: BaseMessage[];
  schemaData: Schema;
  error?: Error;
  buildingSchemaId: string;
  latestVersionNumber: number;
  organizationId: string;
  userId: string;
  designSessionId: string;
  retryCount: Record<string, number>;

  // Requirements analysis
  analyzedRequirements?: AnalyzedRequirements;
  generatedUsecases?: Usecase[];

  // DDL/DML execution
  ddlStatements?: string;
  dmlStatements?: string;
  shouldRetryWithDesignSchema?: boolean;
  ddlExecutionFailed?: boolean;
  ddlExecutionFailureReason?: string;

  // DML execution results
  dmlExecutionSuccessful?: boolean;
  dmlExecutionErrors?: string;
}
```

## Key Features

- **Conditional Routing**: Smart error handling with dynamic routing based on state
- **State Management**: Type-safe state transitions with LangGraph's annotation system
- **Error Handling**: Structured error handling with graceful failure paths
- **Retry Policy**: All nodes are configured with retry policy (maxAttempts: 3)
- **Fallback Mechanism**: Automatic fallback to finalizeArtifacts on critical errors
- **Automatic Timeline Sync**: All AI messages and user messages are automatically synchronized to timeline_items using `withTimelineItemSync` utility
- **Real-time Progress Tracking**: Users can view AI responses in real-time during workflow execution
- **Optimized Memory Usage**: No intermediate state storage for generated responses

## Nodes

1. **webSearch**: Performs initial research and gathers relevant information (performed by pmAgent)
2. **analyzeRequirements**: Organizes and clarifies requirements from user input (performed by pmAnalysisAgent)
3. **designSchema**: Designs database schema with automatic timeline sync (performed by dbAgent)
4. **executeDDL**: Executes DDL statements (performed by agent)
5. **generateUsecase**: Creates use cases for testing with automatic timeline sync (performed by qaAgent)
6. **prepareDML**: Generates DML statements for testing (performed by qaAgent)
7. **validateSchema**: Executes DML and validates schema (performed by qaAgent)
8. **reviewDeliverables**: Performs final confirmation of requirements and deliverables (performed by pmReviewAgent)
9. **finalizeArtifacts**: Generates and saves comprehensive artifacts to database, handles error timeline items (performed by dbAgentArtifactGen)

### Conditional Edge Logic

- **designSchema**: Routes to `executeDDL` on success, `finalizeArtifacts` on error
- **executeDDL**: Routes to `generateUsecase` on success, `designSchema` if retry needed, `finalizeArtifacts` if failed
- **validateSchema**: Routes to `reviewDeliverables` on success, `designSchema` on validation error
- **reviewDeliverables**: Routes to `finalizeArtifacts` on success, `analyzeRequirements` if issues found

## Timeline Synchronization

### Automatic Message Sync with `withTimelineItemSync`

- **Universal Integration**: All AIMessage and HumanMessage instances are automatically synchronized to timeline_items
- **Real-time Updates**: Messages appear in the UI immediately when created during workflow execution
- **Type-appropriate Storage**: 
  - User messages → `type: 'user'`
  - AI responses → `type: 'assistant'` (main conversation messages with timestamps)
  - Progress logs → `type: 'assistant_log'` (intermediate status updates without timestamps)
- **Role Assignment**: Automatic assistant role assignment (`db`, `pm`, `qa`) based on workflow node context
- **Error Resilience**: Timeline sync failures are logged but don't interrupt workflow execution

### Implementation Details

- **User Message Sync**: User input is synchronized in `deepModeling.ts` before workflow execution
- **AI Message Sync**: All workflow nodes (webSearch, analyzeRequirements, designSchema, generateUsecase) automatically sync their AI responses
- **Non-blocking**: Timeline synchronization is asynchronous and non-blocking to ensure workflow performance
- **Utility Function**: `withTimelineItemSync()` provides consistent message synchronization across all nodes

### Memory Optimization

- **No State Bloat**: Messages are not duplicated in workflow state after timeline synchronization
- **Database-Centric**: Frontend reads messages directly from timeline_items table
- **Reduced Serialization**: Less data to serialize/deserialize in workflow state transitions

## Usage

```typescript
import { deepModeling } from "./deepModeling";

const result = await deepModeling(
  {
    userInput:
      "Create a schema for a fitness tracking app with users, workout plans, exercise logs, and progress charts.",
    history: [],
    schemaData: mySchemaData,
    organizationId: "my-organization-id",
    buildingSchemaId: "my-building-schema-id",
    latestVersionNumber: 1,
    userId: "my-user-id",
    designSessionId: "my-design-session-id",
  },
  {
    configurable: {
      repositories,
      logger,
    },
  }
);

// Result is { success: true } on success, or Error on failure
// All user and AI messages are automatically synchronized to timeline_items table
// Frontend receives real-time updates as workflow progresses
// The workflow is typically run as a background job via Trigger.dev
```
