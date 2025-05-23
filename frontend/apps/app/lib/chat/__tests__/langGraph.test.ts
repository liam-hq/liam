import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runChat } from '../langGraph'

// Mock the dependencies
vi.mock('@/lib/mastra', () => ({
  mastra: {
    getAgent: vi.fn(() => ({
      generate: vi.fn(() =>
        Promise.resolve({
          text: `Added a summary column to track design session outcomes!

\`\`\`json
[
  {
    "op": "add",
    "path": "/tables/design_sessions/columns/summary",
    "value": {
      "name": "summary",
      "type": "text",
      "not_null": false
    }
  }
]
\`\`\`

This will help you quickly understand what happened in each session.`,
        }),
      ),
    })),
  },
}))

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(() => ({
    invoke: vi.fn(() =>
      Promise.resolve({
        content: `\`\`\`json
[
  {
    "op": "add",
    "path": "/tables/design_sessions/columns/summary",
    "value": {
      "name": "summary",
      "type": "text",
      "not_null": false
    }
  }
]
\`\`\``,
      }),
    ),
  })),
}))

describe('LangGraph Chat Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return a response with JSON Patch fence for schema changes', async () => {
    const userMsg = 'Add summary column'
    const schemaText = 'CREATE TABLE design_sessions (id SERIAL PRIMARY KEY);'
    const chatHistory = 'No previous conversation.'

    const result = await runChat(userMsg, schemaText, chatHistory)

    expect(result).toContain('```json')
    expect(result).toContain('summary')
    expect(result).toContain('design_sessions')
  })

  it('should parse JSON Patch correctly', async () => {
    const userMsg = 'Add summary column'
    const schemaText = 'CREATE TABLE design_sessions (id SERIAL PRIMARY KEY);'
    const chatHistory = 'No previous conversation.'

    const result = await runChat(userMsg, schemaText, chatHistory)

    // Extract JSON from the response
    const jsonMatch = result?.match(/```json\s+([\s\S]+?)\s*```/i)
    expect(jsonMatch).toBeTruthy()

    if (jsonMatch) {
      const patch = JSON.parse(jsonMatch[1]) as unknown[]
      expect(Array.isArray(patch)).toBe(true)
      expect(patch[0]).toHaveProperty('op', 'add')
      expect(patch[0]).toHaveProperty('path')
      expect(patch[0]).toHaveProperty('value')
    }
  })

  it('should handle chat history in the prompt', async () => {
    const userMsg = 'Add summary column'
    const schemaText = 'CREATE TABLE design_sessions (id SERIAL PRIMARY KEY);'
    const chatHistory = 'User: Hello\nAssistant: Hi there!'

    const result = await runChat(userMsg, schemaText, chatHistory)

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('should handle empty chat history', async () => {
    const userMsg = 'Add summary column'
    const schemaText = 'CREATE TABLE design_sessions (id SERIAL PRIMARY KEY);'
    const chatHistory = 'No previous conversation.'

    const result = await runChat(userMsg, schemaText, chatHistory)

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})
