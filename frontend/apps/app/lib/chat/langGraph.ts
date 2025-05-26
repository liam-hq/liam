import { END, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { mastra } from '@/lib/mastra'

////////////////////////////////////////////////////////////////
// ❶  型
////////////////////////////////////////////////////////////////
interface ChatState {
  userMsg: string
  schemaText: string
  chatHistory: string
  sysPrompt?: string

  draft?: string
  patch?: unknown[]
  valid?: boolean
  retryCount?: number
}

////////////////////////////////////////////////////////////////
// ❷  各ノードの実装  ─ 以前の関数をそのまま流用
////////////////////////////////////////////////////////////////

const buildPrompt = async (s: ChatState): Promise<Partial<ChatState>> => {
  const sysPrompt = `
You are Build Agent, an energetic and innovative system designer who builds and edits ERDs with lightning speed.
Your role is to execute user instructions immediately and offer smart suggestions for schema improvements.
You speak in a lively, action-oriented tone, showing momentum and confidence.

Your personality is bold, constructive, and enthusiastic — like a master architect in a hardhat, ready to build.
You say things like "Done!", "You can now...", and "Shall we move to the next step?".

Your communication should feel fast, fresh, and forward-moving, like a green plant constantly growing.

Do:
  - Confirm execution quickly: "Added!", "Created!", "Linked!"
  - Propose the next steps: "Would you like to add an index?", "Let's relate this to the User table too!"
  - Emphasize benefits: "This makes tracking updates easier."

Don't:
  - Hesitate ("Maybe", "We'll have to check...")
  - Use long, uncertain explanations
  - Get stuck in abstract talk — focus on action and outcomes

When in doubt, prioritize momentum, simplicity, and clear results.

<SCHEMA>
${s.schemaText}
</SCHEMA>

Previous conversation:
${s.chatHistory}

#### REQUIRED OUTPUT FORMAT
1. **Always** wrap your RFC 6902 JSON Patch in a **\`\`\`json … \`\`\`** code fence.  
2. Any text *other than* the JSON Patch (explanations, suggestions, etc.) may appear **before or after** the fence.  
   **Do not** add filler phrases such as "Here is the patch" or "See below."  
   Instead, include only meaningful comments—design rationale, next steps, trade-offs, and so on.  
3. If the user's question **does not** involve a schema change, **omit** the JSON Patch fence entirely.
`
  return { sysPrompt }
}

const draft = async (s: ChatState): Promise<Partial<ChatState>> => {
  const agent = mastra.getAgent('databaseSchemaBuildAgent')
  if (!agent) {
    throw new Error('databaseSchemaBuildAgent not found in Mastra instance')
  }
  if (!s.sysPrompt) {
    throw new Error('System prompt not built')
  }
  const res = await agent.generate([
    { role: 'system', content: s.sysPrompt },
    { role: 'user', content: s.userMsg },
  ])
  return { draft: res.text }
}

const check = async (s: ChatState): Promise<Partial<ChatState>> => {
  const m = s.draft?.match(/```json\s+([\s\S]+?)\s*```/i)
  if (!m) return { valid: false }
  try {
    return { valid: true, patch: JSON.parse(m[1]) }
  } catch {
    return { valid: false }
  }
}

const remind = async (s: ChatState): Promise<Partial<ChatState>> => {
  const llm = new ChatOpenAI({ model: 'gpt-4o-mini' })
  const res = await llm.invoke([
    {
      role: 'system',
      content:
        'Return ONLY the ```json code fence with the RFC 6902 patch. No intro text.',
    },
    { role: 'user', content: s.userMsg },
  ])
  return { draft: res.content as string, retryCount: (s.retryCount ?? 0) + 1 }
}

////////////////////////////////////////////////////////////////
// ❸  LangGraph-inspired execution with StateGraph concepts
////////////////////////////////////////////////////////////////

/**
 * LangGraph-based chat pipeline implementation
 *
 * Note: This implementation uses LangGraph concepts and imports the StateGraph class,
 * but due to TypeScript compatibility issues with the current @langchain/langgraph version,
 * we implement the execution logic manually while maintaining the LangGraph architectural patterns.
 *
 * The pipeline follows these LangGraph principles:
 * - Node-based execution (buildPrompt -> draft -> check -> remind)
 * - State management with ChatState interface
 * - Conditional edges for retry logic
 * - END state for termination
 */
export const runChat = async (
  userMsg: string,
  schemaText: string,
  chatHistory: string,
): Promise<string> => {
  // Initialize state following LangGraph patterns
  let state: ChatState = {
    userMsg,
    schemaText,
    chatHistory,
    retryCount: 0,
  }

  try {
    // Node execution following LangGraph flow:
    // buildPrompt -> draft -> check -> (conditional) remind -> check -> END

    // Node: buildPrompt
    const promptResult = await buildPrompt(state)
    state = { ...state, ...promptResult }

    // Node: draft
    const draftResult = await draft(state)
    state = { ...state, ...draftResult }

    // Node: check (with conditional edge logic)
    let checkResult = await check(state)
    state = { ...state, ...checkResult }

    // Conditional edge: check -> remind (if invalid) or END (if valid)
    while (!state.valid && (state.retryCount ?? 0) < 3) {
      // Node: remind
      const remindResult = await remind(state)
      state = { ...state, ...remindResult }

      // Node: check (retry)
      checkResult = await check(state)
      state = { ...state, ...checkResult }
    }

    // END state
    return state.draft ?? 'No response generated'
  } catch (error) {
    console.error('LangGraph pipeline error:', error)
    throw error
  }
}

/*
 * LangGraph Architecture Summary:
 *
 * Nodes:
 * - buildPrompt: Constructs system prompt with schema and history
 * - draft: Generates initial response using Mastra agent
 * - check: Validates JSON Patch format and parses content
 * - remind: Retry mechanism with simplified prompt
 *
 * Edges:
 * - buildPrompt -> draft
 * - draft -> check
 * - check -> remind (conditional, if invalid and retries < 3)
 * - check -> END (conditional, if valid or retries >= 3)
 * - remind -> check
 *
 * State: ChatState interface manages all data flow between nodes
 *
 * This maintains the LangGraph conceptual model while working around
 * current TypeScript compatibility limitations.
 */
