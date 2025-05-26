import { mastra } from '@/lib/mastra'
import { ChatOpenAI } from '@langchain/openai'

type Ctx = {
  userMsg: string
  schemaText: string
  chatHistory: string
  draft?: string
  patch?: unknown[]
  valid?: boolean
  sysPrompt?: string
  retryCount?: number
}

/* 1) System prompt builder  */
const buildPrompt = (ctx: Ctx): string => {
  return `
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
${ctx.schemaText}
</SCHEMA>

Previous conversation:
${ctx.chatHistory}

#### REQUIRED OUTPUT FORMAT
1. **Always** wrap your RFC 6902 JSON Patch in a **\`\`\`json … \`\`\`** code fence.  
2. Any text *other than* the JSON Patch (explanations, suggestions, etc.) may appear **before or after** the fence.  
   **Do not** add filler phrases such as "Here is the patch" or "See below."  
   Instead, include only meaningful comments—design rationale, next steps, trade-offs, and so on.  
3. If the user's question **does not** involve a schema change, **omit** the JSON Patch fence entirely.
`
}

/* 2) Draft reply (uses existing Mastra agent) */
const draft = async (ctx: Ctx): Promise<string> => {
  const agent = mastra.getAgent('databaseSchemaBuildAgent')
  if (!agent) {
    throw new Error('databaseSchemaBuildAgent not found in Mastra instance')
  }

  const sysPrompt = buildPrompt(ctx)
  const res = await agent.generate([
    { role: 'system', content: sysPrompt },
    { role: 'user', content: ctx.userMsg },
  ])
  return res.text
}

/* 3) Validate patch presence / parse */
const validatePatch = (text: string): { valid: boolean; patch?: unknown[] } => {
  const m = text.match(/```json\s+([\s\S]+?)\s*```/i)
  if (!m) return { valid: false }
  try {
    const patch = JSON.parse(m[1])
    return { valid: true, patch }
  } catch {
    return { valid: false }
  }
}

/* 4) Short reminder prompt (LLM retry) */
const remind = async (userMsg: string): Promise<string> => {
  const llm = new ChatOpenAI({ model: 'gpt-4o-mini' })
  const res = await llm.invoke([
    {
      role: 'system',
      content:
        'Return ONLY the ```json code fence with the RFC 6902 patch. No intro text.',
    },
    {
      role: 'user',
      content: userMsg,
    },
  ])
  return res.content as string
}

/* Main pipeline function */
export const runChat = async (
  userMsg: string,
  schemaText: string,
  chatHistory: string,
): Promise<string> => {
  const ctx: Ctx = { userMsg, schemaText, chatHistory, retryCount: 0 }

  // Step 1: Generate initial draft
  let response = await draft(ctx)

  // Step 2: Validate and retry if needed
  let validation = validatePatch(response)
  let retryCount = 0
  const maxRetries = 3

  while (!validation.valid && retryCount < maxRetries) {
    retryCount++
    try {
      response = await remind(userMsg)
      validation = validatePatch(response)
    } catch (error) {
      console.error(`Retry ${retryCount} failed:`, error)
      break
    }
  }

  return response
}
