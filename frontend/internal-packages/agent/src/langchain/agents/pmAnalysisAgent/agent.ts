import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { tool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
// Remove saveRequirementTool import - now handled as separate workflow node
import { reasoningSchema } from '../../utils/schema'
import type { Reasoning } from '../../utils/types'
import { type AnalysisResponse, JsonParser } from './jsonParser'
import { PM_ANALYSIS_SYSTEM_MESSAGE } from './prompts'

type AnalysisWithReasoning = {
  response: AnalysisResponse
  reasoning: Reasoning | null
}

type ToolCall = {
  id?: string
  name: string
  args: Record<string, unknown>
}

type ModelResponse = {
  content: unknown
  tool_calls?: ToolCall[]
  additional_kwargs?: Record<string, unknown>
}

// Type guard functions
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isToolCall(value: unknown): value is ToolCall {
  return (
    isRecord(value) &&
    'name' in value &&
    typeof value['name'] === 'string' &&
    'args' in value &&
    isRecord(value['args']) &&
    (value['id'] === undefined || typeof value['id'] === 'string')
  )
}

function isModelResponse(value: unknown): value is ModelResponse {
  if (!isRecord(value)) return false

  // Check tool_calls if present
  if ('tool_calls' in value) {
    const toolCalls = value['tool_calls']
    if (toolCalls !== undefined && !Array.isArray(toolCalls)) return false
    if (Array.isArray(toolCalls) && !toolCalls.every(isToolCall)) return false
  }

  // Check additional_kwargs if present
  if ('additional_kwargs' in value) {
    const additionalKwargs = value['additional_kwargs']
    if (additionalKwargs !== undefined && !isRecord(additionalKwargs))
      return false
  }

  return true // Allow objects with content property
}

function toModelResponse(value: unknown): ModelResponse {
  if (isModelResponse(value)) {
    const result: ModelResponse = {
      content: value['content'],
    }

    if (Array.isArray(value['tool_calls'])) {
      result.tool_calls = value['tool_calls']
    }

    if (isRecord(value['additional_kwargs'])) {
      result.additional_kwargs = value['additional_kwargs']
    }

    return result
  }
  return { content: '', tool_calls: [], additional_kwargs: {} }
}

export class PMAnalysisAgent {
  private webSearchTool: DynamicStructuredTool
  private jsonParser: JsonParser

  constructor() {
    // Store tools separately instead of binding them
    this.webSearchTool = this.createWebSearchTool()
    this.jsonParser = new JsonParser()
  }

  private createWebSearchTool() {
    return tool(
      async (input) => {
        // Type guard for input validation
        const inputObj: Record<string, unknown> = isRecord(input) ? input : {}
        const query = String(inputObj['query'])

        const searchResult = await ResultAsync.fromPromise(
          (async () => {
            // Create ChatOpenAI with web search tool binding
            const searchModel = new ChatOpenAI({
              model: 'gpt-4o-mini',
              temperature: 0.3,
            }).bindTools([{ type: 'web_search_preview' }])

            // Use custom prompt instead of createReactAgent default
            const result = await searchModel.invoke([
              new SystemMessage(
                'You are a web search assistant. Use the web search tool to find relevant information. Search thoroughly and provide comprehensive results.',
              ),
              new HumanMessage(
                `Search the web for information about: ${query}`,
              ),
            ])

            // Process tool calls if any were made
            if (result.tool_calls && result.tool_calls.length > 0) {
              let searchResults = ''

              // Execute each tool call
              for (const toolCall of result.tool_calls) {
                if (toolCall.name === 'web_search_preview') {
                  // Create a ToolMessage to continue the conversation with tool results
                  const toolMessage = new ToolMessage({
                    content: 'Search executed',
                    tool_call_id: toolCall.id || '',
                  })

                  // Get the final response with search results
                  // Only include the AI response with tool calls and the tool result
                  const followUpResult = await searchModel.invoke([
                    result, // Include the original response with tool calls
                    toolMessage, // Include the tool execution result
                  ])

                  // Extract content from the follow-up result
                  const content = this.convertContentToString(
                    followUpResult.content,
                  )
                  searchResults += `${content}\n`
                }
              }

              return searchResults || `Web search completed for: ${query}`
            }

            // If no tool calls were made, return the direct response
            return (
              this.convertContentToString(result.content) ||
              `No web search performed for: ${query}`
            )
          })(),
          (error) =>
            error instanceof Error ? error : new Error(String(error)),
        )

        return searchResult.match(
          (result) => result,
          (error) => {
            console.error('Web search error:', error)
            return `Web search failed: ${error.message}`
          },
        )
      },
      {
        name: 'search_web_info',
        description:
          'Search the web for information related to business requirements analysis',
        schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for finding relevant information',
            },
          },
          required: ['query'],
        },
      },
    )
  }

  private async executeWebSearchTool(toolCall: ToolCall): Promise<string> {
    const result = await ResultAsync.fromPromise(
      this.webSearchTool.invoke(toolCall.args),
      (error) => (error instanceof Error ? error : new Error(String(error))),
    )

    return result.match(
      (result) => String(result),
      (error) => {
        console.error('Web search tool execution failed:', error)
        return `Web search failed: ${error.message}`
      },
    )
  }

  // Removed executeSaveRequirementTool - now handled as separate workflow node

  private extractReasoning(finalResponse: ModelResponse): Reasoning | null {
    const reasoningData = finalResponse.additional_kwargs?.['reasoning']
    if (!reasoningData) {
      return null
    }

    const reasoningResult = v.safeParse(reasoningSchema, reasoningData)
    return reasoningResult.success ? reasoningResult.output : null
  }

  private convertContentToString(content: unknown): string {
    if (typeof content === 'string') {
      return content
    }

    if (Array.isArray(content)) {
      // Handle array of content blocks like [{ type: 'text', text: '...' }]
      return content
        .map((item: unknown) => {
          if (typeof item === 'string') {
            return item
          }
          if (isRecord(item) && typeof item['text'] === 'string') {
            return item['text']
          }
          return ''
        })
        .join('')
    }

    if (content && typeof content === 'object') {
      // If content is an object, try to extract text or convert to string
      const contentObj: Record<string, unknown> = isRecord(content)
        ? content
        : {}
      return typeof contentObj['text'] === 'string'
        ? contentObj['text']
        : JSON.stringify(content)
    }

    return String(content)
  }

  async generate(
    messages: BaseMessage[],
  ): Promise<Result<AnalysisWithReasoning, Error>> {
    const allMessages: (BaseMessage | SystemMessage)[] = [
      new SystemMessage(PM_ANALYSIS_SYSTEM_MESSAGE),
      ...messages,
    ]

    // First model call with tools available (no reasoning to avoid API conflicts)
    const toolModel = new ChatOpenAI({
      model: 'o4-mini',
      // No reasoning configuration for tool execution phase
    })
    const modelWithTools = toolModel.bindTools([this.webSearchTool])
    const invokeResult = await modelWithTools.invoke(allMessages)
    const response: ModelResponse = toModelResponse(invokeResult)

    // Prepare messages for final reasoning call
    let finalMessages = allMessages

    // Check if model wants to use tools and execute them
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Execute tools and prepare enhanced messages
      const toolMessages: ToolMessage[] = []
      for (const toolCall of response.tool_calls || []) {
        if (toolCall.name === 'search_web_info') {
          const toolResult = await this.executeWebSearchTool(toolCall)
          toolMessages.push(
            new ToolMessage({
              content: toolResult,
              tool_call_id: toolCall.id || '',
            }),
          )
        }
        // Removed save_requirement_to_artifact tool execution - now handled as separate workflow node
      }

      // Create AIMessage from the response that contains tool_calls
      const aiMessageWithToolCalls = new AIMessage({
        content: this.convertContentToString(response.content),
        tool_calls:
          response.tool_calls?.map((call) => ({
            id: call.id || '',
            name: call.name,
            args: call.args,
          })) || [],
      })

      // Update messages with tool results
      finalMessages = [
        ...allMessages,
        aiMessageWithToolCalls,
        ...toolMessages,
        new SystemMessage(
          'Based on the information gathered, please provide your requirements analysis in JSON format as specified in the initial instructions.',
        ),
      ]
    }

    // Always make final call with reasoning enabled for consistent reasoning output
    const finalModel = new ChatOpenAI({
      model: 'o4-mini',
      reasoning: { effort: 'high', summary: 'detailed' },
      useResponsesApi: true,
    })

    const finalResult = await finalModel.invoke(finalMessages)
    const finalResponse = toModelResponse(finalResult)

    // Extract reasoning and parse content
    const parsedReasoning = this.extractReasoning(finalResponse)
    const contentStr = this.convertContentToString(finalResponse.content)
    const parseResult = await this.jsonParser.parseResponse(contentStr)

    if (parseResult.isErr()) {
      return err(parseResult.error)
    }

    return ok({
      response: parseResult.value,
      reasoning: parsedReasoning,
    })
  }
}
