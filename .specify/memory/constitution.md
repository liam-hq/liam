<!--
Version change: 1.0.0 → 2.0.0
Modified principles: Complete rewrite - shifted from ERD-focused to AI Agent development focus
Added sections: Agent Development Standards, Workflow Architecture Principles
Removed sections: ERD-specific principles (moved to legacy context)
Templates requiring updates: ✅ All templates reviewed and aligned with agent development patterns
Follow-up TODOs: None
-->

# Liam Constitution

## Core Principles

### I. Agent-First Architecture
Every feature must be designed as a specialized, autonomous agent with clear responsibilities. Agents communicate through structured state and command patterns. Multi-agent collaboration over monolithic implementations. Each agent encapsulates domain expertise (PM, DB, QA) and operates as an independent, testable unit.

**Rationale**: Database design requires specialized domain knowledge; agent modularity enables expert-level AI systems and independent scaling.

### II. Subgraph Modularity (NON-NEGOTIABLE)
All agent logic must be implemented as reusable LangGraph subgraphs with internal retry policies, error handling, and state management. No business logic in main workflow - only orchestration. Subgraphs must be independently testable with dedicated test suites.

**Rationale**: LangGraph workflows require isolation for debugging, testing, and reuse across different execution contexts.

### III. State-Safe Workflow Design
All state transitions must be type-safe with explicit annotations. No shared mutable state between agents - communicate through immutable state updates only. Conditional routing based on state, not side effects. Error states must be explicitly modeled and recoverable.

**Rationale**: AI agent workflows are non-deterministic; explicit state management prevents cascading failures and enables workflow debugging.

### IV. Resilient Execution Patterns
Maximum 3 retry attempts per node with exponential backoff. Graceful fallback mechanisms required for all critical paths. Real-time progress tracking for user visibility. No workflow termination without user notification and recovery options.

**Rationale**: AI agents may fail unpredictably; resilience ensures production reliability for database design workflows.

### V. Domain Expertise Encapsulation
Each agent must embody deep domain knowledge: PM agents understand requirements analysis, DB agents master schema design patterns, QA agents specialize in validation strategies. No generic "do everything" agents. Expertise depth over breadth.

**Rationale**: Database design requires specialized knowledge that general-purpose agents cannot adequately provide.

## Agent Development Standards

### LangGraph Implementation
- Use `StateGraphBuilder` with typed annotations for all workflows
- Implement conditional routing with Command pattern for explicit control flow
- Subgraph integration via `graph.addNode("agentName", subgraph)`
- No retry policies on subgraph nodes (handled internally)
- Map-reduce patterns for parallel processing (testcase generation)

### Error Handling & Recovery
- Structured error handling with graceful failure paths
- Automatic fallback to safe termination states
- Error context preservation across workflow steps
- User-friendly error reporting with recovery suggestions

### Real-time User Experience
- Progress streaming during workflow execution
- No intermediate state storage for AI responses (memory optimization)
- Instant feedback for validation errors (PostgreSQL + PGLite)
- Live status updates for long-running operations

## Workflow Architecture Principles

### Agent Specialization
- **Lead Agent**: Intelligent routing and workflow summarization
- **PM Agent**: Requirements analysis and artifact management
- **DB Agent**: Schema design and database operations
- **QA Agent**: Test generation and validation execution
- Clear boundaries, no overlapping responsibilities

### Integration Patterns
- ERD visualization as downstream consumer of agent outputs
- CLI interface for schema processing workflows
- API integration for real-time collaboration
- Database artifact persistence for workflow continuity

### Performance Standards
- Sub-second agent routing decisions (GPT-5-nano)
- Parallel execution where possible (testcase generation)
- Optimized memory usage during long workflows
- Efficient state serialization for workflow persistence

## Technology Architecture

### Current Stack
- **Agent Framework**: LangGraph with TypeScript
- **AI Models**: GPT-5 for complex reasoning, GPT-5-nano for routing
- **Database**: PostgreSQL with PGLite for validation
- **Frontend**: React 19, Next.js 15 (ERD visualization)
- **Build**: Turborepo monorepo with pnpm workspaces

### Legacy Integration
- **Liam ERD**: Existing diagram generation tool (production)
- **CLI Package**: Schema processing and visualization
- **UI Components**: Shared component library for agent interfaces

## Governance

All agent implementations must demonstrate domain expertise and reliable execution patterns. Workflow changes require validation of end-to-end scenarios. No agent modifications without corresponding test updates.

Agent development takes priority over ERD enhancements - ERD is a stable, production tool while agents are pre-release and require focused development effort.

Constitution violations in agent logic block all releases. Multi-agent system reliability is non-negotiable due to the complexity of database design workflows.

Pull requests must include agent integration testing and workflow validation scenarios.

**Version**: 2.0.0 | **Ratified**: 2025-09-26 | **Last Amended**: 2025-09-26