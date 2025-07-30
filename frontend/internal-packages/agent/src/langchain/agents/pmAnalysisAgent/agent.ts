import {
  AIMessage,
  type BaseMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { tool } from '@langchain/core/tools'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import { initChatModel } from 'langchain/chat_models/universal'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { reasoningSchema } from '../../utils/schema'
import type { Reasoning } from '../../utils/types'
import { PM_ANALYSIS_SYSTEM_MESSAGE } from './prompts'

const requirementsAnalysisSchema = v.strictObject({
  businessRequirement: v.string(),
  functionalRequirements: v.record(v.string(), v.array(v.string())),
  nonFunctionalRequirements: v.record(v.string(), v.array(v.string())),
})
type AnalysisResponse = v.InferOutput<typeof requirementsAnalysisSchema>

type AnalysisWithReasoning = {
  response: AnalysisResponse
  reasoning: Reasoning | null
}

type SearchResult = {
  messages?: Array<{
    _type?: string
    name?: string
    content: unknown
  }>
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

function toSearchResult(value: unknown): SearchResult {
  if (isRecord(value)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return value as SearchResult
  }
  return { messages: [] }
}

function toModelResponse(value: unknown): ModelResponse {
  if (isRecord(value)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return value as ModelResponse
  }
  return { content: '', tool_calls: [], additional_kwargs: {} }
}

export class PMAnalysisAgent {
  private webSearchTool: DynamicStructuredTool

  constructor() {
    // Store tool separately instead of binding it
    this.webSearchTool = this.createWebSearchTool()
  }

  private createWebSearchTool() {
    return tool(
      async (input) => {
        // Type guard for input validation
        const inputObj: Record<string, unknown> = isRecord(input) ? input : {}
        const query = String(inputObj['query'])

        const searchResult = await ResultAsync.fromPromise(
          (async () => {
            // Use gpt-4o-mini specifically for web search
            const searchModel = await initChatModel('openai:gpt-4o-mini', {
              temperature: 0.3,
            })

            // Create a temporary agent for web search
            const searchAgent = createReactAgent({
              llm: searchModel,
              tools: [{ type: 'web_search_preview' }],
            })

            const result = await searchAgent.invoke({
              messages: [`Search the web for: ${query}`],
            })

            // Extract search results from the response
            const searchResult: SearchResult = toSearchResult(result)
            return this.extractSearchResults(searchResult)
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

  private extractSearchResults(searchResult: SearchResult): string {
    if (
      !searchResult ||
      !searchResult.messages ||
      !Array.isArray(searchResult.messages)
    ) {
      return 'No search results available'
    }

    // Find tool messages with web search results
    const toolResults = searchResult.messages
      .filter(
        (msg) => msg._type === 'tool' && msg.name === 'web_search_preview',
      )
      .map((msg) => msg.content)
      .filter(
        (content): content is string =>
          content != null && typeof content === 'string',
      )

    if (toolResults.length > 0) {
      return toolResults.join('\n\n')
    }

    // Fallback: get the last message content
    const lastMessage = searchResult.messages[searchResult.messages.length - 1]
    if (lastMessage?.content) {
      return typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content)
    }

    return 'No search results found'
  }

  private async parseResponse(
    content: string,
  ): Promise<Result<AnalysisResponse, Error>> {
    // Try to extract JSON from the response
    let jsonStr: string | null = null

    // Strategy 1: Extract from ```json code blocks
    const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch?.[1]?.trim()) {
      jsonStr = codeBlockMatch[1].trim()
    }

    // Strategy 2: Extract from ``` code blocks (without json specifier)
    if (!jsonStr) {
      const genericCodeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/)
      if (genericCodeBlockMatch?.[1]?.trim()) {
        const candidate = genericCodeBlockMatch[1].trim()
        // Check if it looks like JSON
        if (candidate.startsWith('{') && candidate.endsWith('}')) {
          jsonStr = candidate
        }
      }
    }

    // Strategy 3: Find any JSON-like structure in the entire content
    if (!jsonStr) {
      const jsonMatch = content.match(/\{[\s\S]*?\}/)
      if (jsonMatch?.[0]) {
        jsonStr = jsonMatch[0].trim()
      }
    }

    if (!jsonStr) {
      return err(new Error('No JSON found in response'))
    }

    const parseResult = ResultAsync.fromPromise(
      Promise.resolve(JSON.parse(jsonStr)),
      (parseError) =>
        parseError instanceof Error
          ? parseError
          : new Error(String(parseError)),
    )

    const parsed = await parseResult.match(
      (result) => ok(result),
      (error) => {
        console.error('JSON.parse failed:', error)
        return err(new Error(`JSON parsing failed: ${error.message}`))
      },
    )

    if (parsed.isErr()) {
      return parsed
    }

    // Validate the analysis structure
    const analysisResult = v.safeParse(requirementsAnalysisSchema, parsed.value)

    if (!analysisResult.success) {
      console.error('Validation failed:', analysisResult.issues)
      return err(
        new Error(
          `Validation failed: ${JSON.stringify(analysisResult.issues)}`,
        ),
      )
    }

    return ok(analysisResult.output)
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

  private async executeToolsAndContinue(
    response: ModelResponse,
    allMessages: (BaseMessage | SystemMessage)[],
  ): Promise<ModelResponse> {
    // Execute tools
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

    // Continue conversation with tool results - include the AIMessage with tool_calls
    const updatedMessages = [
      ...allMessages,
      aiMessageWithToolCalls, // Include the AIMessage that contains the tool_calls
      ...toolMessages,
      new SystemMessage(
        'Based on the information gathered, please provide your requirements analysis in JSON format as specified in the initial instructions.',
      ),
    ]

    // Second model call for final analysis with reasoning enabled
    const finalModel = new ChatOpenAI({
      model: 'o4-mini',
      reasoning: { effort: 'high', summary: 'detailed' },
      useResponsesApi: true,
    })

    const result = await finalModel.invoke(updatedMessages)
    return toModelResponse(result)
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

    // Check if model wants to use tools and execute them
    const finalResponse =
      response.tool_calls && response.tool_calls.length > 0
        ? await this.executeToolsAndContinue(response, allMessages)
        : response

    // Extract reasoning and parse content
    const parsedReasoning = this.extractReasoning(finalResponse)
    const contentStr = this.convertContentToString(finalResponse.content)
    const parseResult = await this.parseResponse(contentStr)

    if (parseResult.isErr()) {
      return err(parseResult.error)
    }

    return ok({
      response: parseResult.value,
      reasoning: parsedReasoning,
    })
  }
}
