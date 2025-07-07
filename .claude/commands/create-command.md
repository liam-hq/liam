---
allowed-tools: Read, LS
description: Create a new custom slash command with best practices
---

## Task: Create a New Custom Slash Command

### Input
`$ARGUMENTS`

### Process

1. **Understand the user's intent**
   - Infer appropriate command name and description from the input
   - Command name should be kebab-case

2. **Create the command file**
   - Location: `.claude/commands/<command-name>.md`
   - Start with minimal structure
   - Only add complexity if needed

### Important Guidelines
- **Keep instructions concise** - Long instructions may be partially understood
- **Start simple** - Basic commands only need a Task section
- **Avoid over-specification** - Don't add allowed-tools unless necessary
- **Focus on clarity** - Simple, direct instructions work best

### Minimal Template
```markdown
---
description: [Command description]
---

## Task
[Brief, clear instruction]
```

### Extended Template (when needed)
```markdown
---
description: [Command description]
allowed-tools: [Only if specific tools needed]
---

## Context
[Dynamic context if helpful]

## Task
[Clear instructions]

### Arguments
$ARGUMENTS
```

Create the most appropriate command structure for the user's needs.