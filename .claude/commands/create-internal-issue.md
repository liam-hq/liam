---
description: Create an issue in the route06/liam-internal repository
---

## Task
Create a new issue in the route06/liam-internal repository using the GitHub CLI.

### Process
1. **Analyze the request**: First, understand the context and technical implications
2. **Gather information**: If the issue involves technical implementation, think through:
   - Current state vs desired state
   - Technical requirements and dependencies
   - Potential implementation approaches
   - Impact and risks
3. **Structure the issue**: Create a well-structured issue with:
   - Clear title in Japanese
   - Detailed body with background, requirements, and technical considerations
   - Use proper markdown formatting

Use the `gh issue create --repo route06/liam-internal` command to create the issue.  
Write both the issue title **and** body in Japanese.

### Arguments
$ARGUMENTS

**Argument Handling**:
- When arguments are provided: Create an issue based on the given content
- When arguments are empty: Detect technical discussions from recent conversation and suggest creating an issue based on that context
- When instructed to "create from conversation": Analyze conversation history to generate an issue

### Examples
- Simple issue: `/create-internal-issue "バグ: データベース接続タイムアウト"`
- Complex feature: `/create-internal-issue "現在のログイン方法を改善したい - 詳細な要件があります"`
- Context-based: `/create-internal-issue "create an issue from what we just discussed"`
- Empty args: `/create-internal-issue` (suggest auto-detection from conversation)

### Best Practices
- **Argument validation**: When arguments are empty, first analyze available conversation context
- **Conversation history utilization**: Auto-detect technical investigations, bug discoveries, refactoring proposals
- **Research integration**: Use code investigation and search results as evidence for the issue
- **Structured issues**: Include the following sections:
  - Overview (problem summary)
  - Current state (technical current situation)
  - Investigation results (detailed research findings)
  - Action items (specific work to be done)
  - Impact analysis (risks and benefits)
  - Technical considerations (implementation notes)
- **Evidence documentation**: Include specific file paths, line numbers, and search results