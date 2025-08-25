---
description: Create and run a standalone TypeScript debug script with minimal dependencies
---

## Purpose
Create a one-off TypeScript debug script for quick testing and debugging. The script should be self-contained with minimal external dependencies.

## Constraints
- **Minimal imports** - Prefer Node.js built-ins and existing packages when possible
- **Single file** - Everything in one TypeScript file
- **Temporary nature** - Script may be deleted after use

## Decision Criteria

### Location Selection
```
IF debugging agent-related code:
  → frontend/internal-packages/agent/scripts/
ELSE IF debugging specific package:
  → [package-root]/scripts/
ELSE:
  → frontend/scripts/
```

### Naming Convention
- Pattern: `debug-[specific-purpose].ts`
- Examples:
  - `debug-multi-agent-supervisor.ts`
  - `debug-api-connection.ts`
  - `debug-memory-leak.ts`

## Implementation Steps

1. **Create directory** (if not exists):
   ```bash
   mkdir -p [chosen-location]/scripts
   ```

2. **Generate script** with this structure:
   ```typescript
   #!/usr/bin/env node
   
   // === Configuration ===
   // If env vars needed, calculate path from script to root .env:
   // import { config } from 'dotenv'
   // import { resolve } from 'node:path'
   // config({ path: resolve(__dirname, '../../.env') }) // Adjust '../' count based on script depth
   // if (!process.env.REQUIRED_VAR) throw new Error('Failed to load .env')
   
   // === Debug Logic ===
   async function debug() {
     console.log('🔍 Starting debug:', '[purpose]')
     console.log('─'.repeat(50))
     
     // User's debug logic here
     
     console.log('─'.repeat(50))
     console.log('✅ Debug completed')
   }
   
   // === Execute ===
   debug().catch(err => {
     console.error('❌ Debug failed:', err)
     process.exit(1)
   })
   ```

3. **Execute script**:
   ```bash
   cd [package-directory]
   npx tsx scripts/debug-[purpose].ts
   ```

## Output Requirements
- Use emojis for visual clarity: 🔍 (start), ✅ (success), ❌ (error)
- Include timestamps for time-sensitive debugging
- Use separators for readability
- Show clear error messages with stack traces

## Post-Execution
- Ask user if they want to keep the script
- If temporary, offer to delete it

## Examples

### Example 1: Simple Value Check
```typescript
// User: "I want to debug the config values"
// Generated: frontend/internal-packages/agent/scripts/debug-config-values.ts

async function debug() {
  console.log('🔍 Checking config values')
  console.log('API_URL:', process.env.API_URL)
  console.log('NODE_ENV:', process.env.NODE_ENV)
}
```

### Example 2: Async Operation Test
```typescript
// User: "Test if the API connection works"
// Generated: frontend/internal-packages/agent/scripts/debug-api-connection.ts

async function debug() {
  console.log('🔍 Testing API connection')
  const response = await fetch(process.env.API_URL + '/health')
  console.log('Status:', response.status)
}
```

## Arguments
$ARGUMENTS