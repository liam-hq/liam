
# Refactor chat pipeline to LangGraph

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

## 1 ️⃣  Dependencies

✓ done


```bash
pnpm add @langchain/core @langchain/openai langgraph
````

---

## 2 ️⃣  New helper: `lib/chat/langGraph.ts`

Create **`frontend/apps/app/lib/chat/langGraph.ts`**.

````ts
import { Graph } from "langgraph";
import { chat, system, user } from "@ai-sdk/openai";
import { mastra } from "@/lib/mastra";

type Ctx = {
  userMsg: string;
  schemaText: string;
  draft?: string;      // full LLM reply (may contain patch)
  patch?: unknown[];   // parsed JSON Patch
  valid?: boolean;
};

/* 1) System prompt builder  */
const buildPrompt = async (ctx: Ctx) => ({
  ...ctx,
  sysPrompt: `
You are Build Agent … (same tone/personality)

<SCHEMA>
${ctx.schemaText}
</SCHEMA>

#### REQUIRED OUTPUT FORMAT
1. Always wrap your RFC 6902 JSON Patch in a \`\`\`json … \`\`\` fence.
2. Any non-patch text may appear before **or** after the fence.
   Do **not** add filler such as “Here is the patch”.
   Only add meaningful comments (design rationale, next steps, etc.).
3. If no schema change is needed, omit the JSON Patch fence.
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
  const res = await chat([
    system(
      "Return ONLY the ```json code fence with the RFC 6902 patch. No intro text."
    ),
    user(ctx.userMsg),
  ]);
  return { ...ctx, draft: res.text };
};

/* 5) Finish */
const final = (ctx: Ctx) => ctx.draft!;

/* Assemble graph */
const g = new Graph<Ctx>();
g.node("buildPrompt", buildPrompt);
g.node("draft", draft);
g.node("check", check);
g.node("remind", remind);
g.node("final", final);

g.edge("buildPrompt", "draft");
g.edge("draft", "check");
g.edge("check", (ctx) => (ctx.valid ? "final" : "remind"));
g.edge("remind", "check");

g.maxIterations(3); // stop after 1 reminder

export const runChat = (userMsg: string, schemaText: string) =>
  g.run({ userMsg, schemaText });
````

---

## 3 ️⃣  **route.ts** changes

Path: `frontend/apps/app/app/api/chat/route.ts`

### 🔑 Key edits

1. **Remove** the entire `mastra.getAgent(...).generate(...)` block.
2. **Import** and call `runChat` from the helper above.
3. Keep the vector-store sync logic *as is* (before invoking `runChat`).
4. Return `responseText` from `runChat` directly.

### ✂️ Diff sketch

```diff
-import { mastra } from '@/lib/mastra'
+import { runChat } from '@/app/lib/chat/langGraph'

@@
-    // Get the agent from Mastra
-    const agent = mastra.getAgent(agentName)
-    if (!agent) {
-      throw new Error(`${agentName} not found in Mastra instance`)
-    }
-
-    // Create a response using the agent
-    const response = await agent.generate([ ... ])
-
-    return new Response(response.text, {
+    const responseText = await runChat(message, schemaText)
+
+    return new Response(responseText, {
       headers: { 'Content-Type': 'text/plain; charset=utf-8' },
     })
```

*(You can drop the obsolete “format warning” array in the third message since LangGraph now enforces the rule.)*

---

## 4 ️⃣  **databaseSchemaBuildAgent.ts** prompt tweak

1. **Replace** the current instruction’s “REQUIRED OUTPUT FORMAT” block with **exactly** the one used in `buildPrompt` above to avoid diverging rules.
2. Remove the earlier duplication (“GOOD: Updated. Here you go.” etc.).

> Only the string literal inside `instructions:` needs editing; no TypeScript changes.

---

## 5 ️⃣  Tests / Acceptance

* **Unit:**

  * Write a Jest/Vitest spec that feeds in `userMsg = "Add summary column"` and a minimal schema, asserts that `runChat` returns a string containing a \`\`\`json fence and that `JSON.parse` of the fence is an array.
* **E2E (optional):**

  * Hit `POST /api/chat` with the same payload via `supertest`, expect `200 OK` and the fence.

---

## 6 ️⃣  Roll-out checklist

* [ ] `pnpm i` ✓
* [ ] `turbo lint && turbo test` green ✓
* [ ] Stage, commit:

  ```
  chore(chat): migrate schema-build flow to LangGraph pipeline
  ```
* [ ] Push & verify preview deployment

---


