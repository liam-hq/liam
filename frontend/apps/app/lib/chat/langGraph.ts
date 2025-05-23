import { mastra } from '@/lib/mastra'
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'

////////////////////////////////////////////////////////////////
// 1. Type definitions for the StateGraph
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

// define the annotations for the StateGraph
const ChatStateAnnotation = Annotation.Root({
  userMsg: Annotation<string>,
  schemaText: Annotation<string>,
  chatHistory: Annotation<string>,
  sysPrompt: Annotation<string>,
  draft: Annotation<string>,
  patch: Annotation<unknown[]>,
  valid: Annotation<boolean>,
  retryCount: Annotation<number>,
})

////////////////////////////////////////////////////////////////
// 2. Implementation of the StateGraph nodes
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
// 3. build StateGraph
////////////////////////////////////////////////////////////////
export const runChat = async (
  userMsg: string,
  schemaText: string,
  chatHistory: string,
) => {
  try {
    const graph = new StateGraph(ChatStateAnnotation)

    graph
      .addNode('buildPrompt', buildPrompt)
      .addNode('drafted', draft)
      .addNode('check', check)
      .addNode('remind', remind)
      .addEdge(START, 'buildPrompt')
      .addEdge('buildPrompt', 'drafted')
      .addEdge('remind', 'check')

      // conditional edges
      .addConditionalEdges('check', (s: ChatState) => {
        if (s.valid) return END
        if ((s.retryCount ?? 0) >= 3) return END // give up
        return 'remind'
      })

    // execution
    const compiled = graph.compile()
    const result = await compiled.invoke(
      {
        userMsg,
        schemaText,
        chatHistory,
        retryCount: 0,
      },
      {
        recursionLimit: 4, // for avoid deep recursion
      },
    )

    return result.draft ?? 'No response generated'
  } catch (error) {
    console.error(
      'StateGraph execution failed, falling back to manual execution:',
      error,
    )
    // some fallback logic
  }
}
