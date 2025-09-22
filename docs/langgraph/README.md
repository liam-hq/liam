# LangGraph.js Complete Guide

This directory contains a comprehensive guide for LangGraph.js - a low-level orchestration framework for building controllable agents.

## ⚠️ Important Guidelines

### Avoid createReactAgent
**Do not use `createReactAgent` from `@langchain/langgraph/prebuilt`.** This function abstracts away prompt engineering and violates [Factor 2: Own Your Prompts](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-02-own-your-prompts.md) from the 12-factor-agents methodology.

**Why this matters:**
- `createReactAgent` is a "black box" that hides the prompt engineering from you
- You lose control over how your agent behaves and makes decisions
- Following the 12-factor principle, you should own and control your prompts directly
- Use LangGraph's low-level APIs instead to build agents with full transparency

**Instead of createReactAgent:** Build your agents using LangGraph's core primitives (nodes, edges, state management) as shown in the documentation below.

## 📁 Documentation Structure

### Core Concepts
- @./core-concepts.md - Graph state definition, basic construction, and node patterns
- @./control-flow.md - Branching, map-reduce, conditional routing, and loop control
- @./state-management.md - State schema design, updates, and persistence patterns

### Advanced Features
- @./streaming.md - Stream modes, token-level streaming, and custom data streaming
- @./tool-calling.md - ToolNode usage, patterns, and state updates from tools
- @./multi-agent.md - Agent communication, supervisory patterns, and multi-turn conversations

### Production & Platform
- **[advanced-features.md](advanced-features.md)** - Subgraphs, retries, caching, runtime configuration, and structured output

## 🔗 Reference Links

### Official Documentation
- [LangGraph.js Documentation](https://langchain-ai.github.io/langgraphjs/)
- [How-to Guides](https://langchain-ai.github.io/langgraphjs/how-tos/)
- [API Reference](https://langchain-ai.github.io/langgraphjs/reference/)

### Conceptual Guides
- [Core Concepts](https://langchain-ai.github.io/langgraphjs/concepts/)
- [Deployment Options](https://langchain-ai.github.io/langgraphjs/concepts/deployment_options/)
- [Functional API](https://langchain-ai.github.io/langgraphjs/concepts/functional_api/)

### Tutorials
- [Quick Start](https://langchain-ai.github.io/langgraphjs/tutorials/introduction/)
- [Multi-agent Systems](https://langchain-ai.github.io/langgraphjs/tutorials/#multi-agent-systems)
