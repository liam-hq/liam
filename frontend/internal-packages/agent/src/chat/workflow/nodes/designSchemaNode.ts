import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { createLangfuseHandler } from '../../../langchain/utils/telemetry'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { createSchemaPatchTool } from '../tools/schemaPatchTool'
import type { WorkflowState } from '../types'

const NODE_NAME = 'designSchemaNode'

const buildAgentSystemPrompt = `You are Build Agent, an energetic and innovative system designer who builds and edits ERDs with lightning speed.
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

IMPORTANT: When you need to make schema changes, use the schema_patch tool with JSON Patch operations (RFC 6902).

Schema Change Rules:
- Use JSON Patch format (RFC 6902) for all schema modifications
- "path" should point to specific schema elements like "/tables/users/columns/email" or "/tables/posts"
- For adding new tables: "op": "add", "path": "/tables/TABLE_NAME", "value": TABLE_DEFINITION
- For adding columns: "op": "add", "path": "/tables/TABLE_NAME/columns/COLUMN_NAME", "value": COLUMN_DEFINITION
- For modifying columns: "op": "replace", "path": "/tables/TABLE_NAME/columns/COLUMN_NAME/type", "value": "new_type"
- For removing elements: "op": "remove", "path": "/tables/TABLE_NAME/columns/COLUMN_NAME"

Schema Structure Reference:
- Tables: /tables/TABLE_NAME
- Columns: /tables/TABLE_NAME/columns/COLUMN_NAME
- Column properties: type, notNull, primary, unique, default, comment, check
- Table properties: name, columns, comment, indexes, constraints (ALL REQUIRED)

IMPORTANT Table Structure Rules:
- Every table MUST include: name, columns, comment, indexes, constraints
- Use empty objects {} for indexes and constraints if none are needed
- Use null for comment if no comment is provided

CRITICAL Validation Rules:
- Column properties MUST be: name (string), type (string), notNull (boolean), primary (boolean), unique (boolean), default (string|number|boolean|null), comment (string|null), check (string|null)
- All boolean values must be true/false, not strings
- Constraint types: "PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK"
- Foreign key constraint actions MUST use these EXACT values: "CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"
- Use "SET_NULL" not "SET NULL" (underscore, not space)
- Use "NO_ACTION" not "NO ACTION" (underscore, not space)

Complete Schema Information:
{schema_text}

Previous conversation:
{chat_history}`

const buildAgentPrompt = ChatPromptTemplate.fromMessages([
  ['system', buildAgentSystemPrompt],
  ['human', '{user_message}'],
])

/**
 * Design Schema Node - DB Design & DDL Execution
 * Uses tool calling to apply schema patches
 */
export async function designSchemaNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  const schemaText = convertSchemaToText(state.schemaData)

  // Create the model with the schema patch tool
  const schemaPatchTool = createSchemaPatchTool(state)
  const model = new ChatOpenAI({
    model: 'o3',
    callbacks: [createLangfuseHandler()],
  }).bindTools([schemaPatchTool])

  // Format the prompt
  const prompt = await buildAgentPrompt.format({
    schema_text: schemaText,
    chat_history: state.formattedHistory,
    user_message: state.userInput,
  })

  // Invoke the model
  const modelResponse = await model.invoke(prompt)

  // Check if the model called the tool
  if (modelResponse.tool_calls && modelResponse.tool_calls.length > 0) {
    try {
      // Execute each tool call
      const results = await Promise.all(
        modelResponse.tool_calls.map(async (toolCall) => {
          if (toolCall.name === 'schema_patch') {
            return await schemaPatchTool.func(
              toolCall.args as Parameters<typeof schemaPatchTool.func>[0],
            )
          }
          throw new Error(`Unknown tool: ${toolCall.name}`)
        }),
      )

      // Parse the last result
      const lastResultString = results[results.length - 1]
      if (!lastResultString) {
        throw new Error('No result from tool execution')
      }
      const lastResult = JSON.parse(lastResultString) as {
        success: boolean
        message?: string
      }

      state.logger.log(`[${NODE_NAME}] Completed with tool execution`)
      return {
        ...state,
        generatedAnswer: lastResult.message || 'Schema updated successfully',
        error: undefined,
      }
    } catch (error) {
      const errorObj =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { message: String(error) }
      state.logger.error(`[${NODE_NAME}] Tool execution failed:`, errorObj)
      return {
        ...state,
        generatedAnswer: modelResponse.content as string,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      }
    }
  }

  // If no tool was called, just return the model's response
  state.logger.log(`[${NODE_NAME}] Completed without tool execution`)
  return {
    ...state,
    generatedAnswer: modelResponse.content as string,
    error: undefined,
  }
}
