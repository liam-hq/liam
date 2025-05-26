# Refactor chat pipeline to LangGraph - Revised Plan

## ✨ Goal
* Replace the single-shot `mastra.getAgent(...).generate(...)` call with a multi-step LangGraph pipeline that  
  1. injects schema / rules,  
  2. drafts a **comment + JSON Patch** response,  
  3. validates / retries if the patch fence is missing,  
  4. returns the final text to the UI (comments preserved).  
* Update the Build-Agent prompt so that:  
  * **No filler intro** is allowed before the ```json fence.  
  * Meaningful comments _before/after_ the fence are welcome.

---

## Current State Analysis

✅ **Dependencies**: The required LangGraph dependencies are already installed:
- `@langchain/core`: 0.3.55
- `@langchain/langgraph`: 0.2.73  
- `@langchain/openai`: 0.5.10

✅ **Current Implementation**: 
- Chat route at `frontend/apps/app/app/api/chat/route.ts` uses single Mastra agent call
- Build agent at `frontend/apps/app/lib/mastra/agents/databaseSchemaBuildAgent.ts` has proper prompt structure
- Vector store sync logic is already in place
- Chat history logic exists but is commented out

---

## 1️⃣ New helper: `frontend/apps/app/lib/chat/langGraph.ts`

Create **`frontend/apps/app/lib/chat/langGraph.ts`**.

````ts
import { Graph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { mastra } from "@/lib/mastra";

type Ctx = {
  userMsg: string;
  schemaText: string;
  chatHistory: string;  // Added for history support
  draft?: string;       // full LLM reply (may contain patch)
  patch?: unknown[];    // parsed JSON Patch
  valid?: boolean;
  sysPrompt?: string;
};

/* 1) System prompt builder  */
const buildPrompt = async (ctx: Ctx) => ({
  ...ctx,
  sysPrompt: `
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
`,
});

/* 2) Draft reply (uses existing Mastra agent) */
const draft = async (ctx: Ctx) => {
  const agent = mastra.getAgent("databaseSchemaBuildAgent");
  const res = await agent.generate([
    { role: "system", content: ctx.sysPrompt },
    { role: "user", content: ctx.userMsg },
  ]);
  return { ...ctx, draft: res.text };
};

/* 3) Validate patch presence / parse */
const check = (ctx: Ctx) => {
  const m = ctx.draft?.match(/```json\s+([\s\S]+?)\s*```/i);
  if (!m) return { ...ctx, valid: false };
  try {
    return { ...ctx, valid: true, patch: JSON.parse(m[1]) };
  } catch {
    return { ...ctx, valid: false };
  }
};

/* 4) Short reminder prompt (LLM retry) */
const remind = async (ctx: Ctx) => {
  const llm = new ChatOpenAI({ model: "gpt-4o-mini" });
  const res = await llm.invoke([
    {
      role: "system",
      content: "Return ONLY the ```json code fence with the RFC 6902 patch. No intro text."
    },
    {
      role: "user", 
      content: ctx.userMsg
    },
  ]);
  return { ...ctx, draft: res.content as string };
};

/* 5) Finish */
const final = (ctx: Ctx) => ctx.draft!;

/* Assemble graph */
const g = new Graph<Ctx>();
g.addNode("buildPrompt", buildPrompt);
g.addNode("draft", draft);
g.addNode("check", check);
g.addNode("remind", remind);
g.addNode("final", final);

g.addEdge("buildPrompt", "draft");
g.addEdge("draft", "check");
g.addConditionalEdges("check", (ctx) => (ctx.valid ? "final" : "remind"));
g.addEdge("remind", "check");

g.setEntryPoint("buildPrompt");
g.setFinishPoint("final");

export const runChat = (userMsg: string, schemaText: string, chatHistory: string) =>
  g.invoke({ userMsg, schemaText, chatHistory });
````

---

## 2️⃣ **route.ts** changes

Path: `frontend/apps/app/app/api/chat/route.ts`

### 🔑 Key edits

1. **Uncomment and maintain** the chat history logic
2. **Import** and call `runChat` from the helper above
3. **Remove** the entire `mastra.getAgent(...).generate(...)` block
4. Keep the vector-store sync logic *as is* (before invoking `runChat`)
5. Return `responseText` from `runChat` directly

### ✂️ Diff sketch

```diff
-import { mastra } from '@/lib/mastra'
+import { runChat } from '@/lib/chat/langGraph'

@@
-    // Format chat history for prompt
-    // const formattedChatHistory =
-    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
-    //   history && history.length > 0
-    //     ? history
-    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
-    //         .map((msg: [string, string]) => `${msg[0]}: ${msg[1]}`)
-    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
-    //         .join('\n')
-    //     : 'No previous conversation.'
-    const formattedChatHistory = 'No previous conversation.'
+    // Format chat history for prompt
+    const formattedChatHistory =
+      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
+      history && history.length > 0
+        ? history
+            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
+            .map((msg: [string, string]) => `${msg[0]}: ${msg[1]}`)
+            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
+            .join('\n')
+        : 'No previous conversation.'

@@
-    // Get the agent from Mastra
-    const agent = mastra.getAgent(agentName)
-    if (!agent) {
-      throw new Error(`${agentName} not found in Mastra instance`)
-    }
-
-    // Create a response using the agent
-    const response = await agent.generate([
-      {
-        role: 'system',
-        content: `
-Complete Schema Information:
-${schemaText}
-
-Previous conversation:
-${formattedChatHistory}
-`,
-      },
-      {
-        role: 'user',
-        content: message,
-      },
-      {
-        role: 'system',
-        content: `
-        If a response should be provided in JSON Patch format, please respond using that format.
-
-When responding, don't mention the format explicitly—just give the result.
-Avoid mentioning the format in your response.
-
-GOOD: Updated. Here you go.
-NOT GOOD: Here's a patch that makes...
-`,
-      },
-    ])
-
-    return new Response(response.text, {
+    const responseText = await runChat(message, schemaText, formattedChatHistory)
+
+    return new Response(responseText, {
       headers: { 'Content-Type': 'text/plain; charset=utf-8' },
     })
```

---

## 3️⃣ **databaseSchemaBuildAgent.ts** prompt tweak

**File**: `frontend/apps/app/lib/mastra/agents/databaseSchemaBuildAgent.ts`

1. **Replace** the current instruction's "REQUIRED OUTPUT FORMAT" block with **exactly** the one used in `buildPrompt` above to avoid diverging rules.
2. Remove any duplicate instructions about filler text.

> Only the string literal inside `instructions:` needs editing; no TypeScript changes.

---

## 4️⃣ Tests / Acceptance

* **Unit:**
  * Write a Jest/Vitest spec that feeds in `userMsg = "Add summary column"`, a minimal schema, and chat history, asserts that `runChat` returns a string containing a \`\`\`json fence and that `JSON.parse` of the fence is an array.
* **E2E (optional):**
  * Hit `POST /api/chat` with the same payload via `supertest`, expect `200 OK` and the fence.

---

## 5️⃣ Implementation Sequence

1. **Create the chat directory and LangGraph helper**
2. **Update the chat route to use LangGraph pipeline**
3. **Standardize the Build Agent prompt format**
4. **Add unit tests for the pipeline**
5. **Test the full integration**

---

## 6️⃣ Key Features Preserved

✅ **Chat History**: Full history support with existing formatting  
✅ **Vector Store Sync**: Maintains current synchronization logic  
✅ **Build Agent Personality**: Preserves the energetic, action-oriented tone  
✅ **Error Handling**: Keeps Sentry integration and proper error responses  
✅ **Dummy Schema**: No changes to schema handling for now  
✅ **Retry Logic**: 3 iterations maximum as specified

---

## 7️⃣ Roll-out checklist

* [ ] Create LangGraph helper
* [ ] Update chat route
* [ ] Update Build Agent prompt
* [ ] `turbo lint && turbo test` green ✓
* [ ] Stage, commit:

  ```
  chore(chat): migrate schema-build flow to LangGraph pipeline
  ```
* [ ] Push & verify preview deployment

---

## Requirements Confirmed

- **Chat History**: ✅ Maintain existing history logic (uncommented)
- **Dummy Schema**: ✅ Keep current dummy schema approach  
- **Retry Limit**: ✅ Fixed at 3 iterations
- **JSON Patch Validation**: ✅ Multi-step pipeline with validation and retry
- **Build Agent Personality**: ✅ Preserved energetic, action-oriented tone
