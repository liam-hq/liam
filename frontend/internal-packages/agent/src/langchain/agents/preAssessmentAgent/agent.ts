import { type BaseMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { err, ok, type Result } from 'neverthrow'
import * as v from 'valibot'
import { reasoningSchema } from '../../utils/schema'
import type { Reasoning } from '../../utils/types'
import {
  PreAssessmentJsonParser,
  type PreAssessmentResponse,
} from './jsonParser'
import { PRE_ASSESSMENT_SYSTEM_MESSAGE } from './prompts'

type PreAssessmentWithReasoning = {
  response: PreAssessmentResponse
  reasoning: Reasoning | null
}

type ModelResponse = {
  content: unknown
  additional_kwargs?: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isModelResponse(value: unknown): value is ModelResponse {
  if (!isRecord(value)) return false

  if ('additional_kwargs' in value) {
    const additionalKwargs = value['additional_kwargs']
    if (additionalKwargs !== undefined && !isRecord(additionalKwargs))
      return false
  }

  return true
}

function toModelResponse(value: unknown): ModelResponse {
  if (isModelResponse(value)) {
    const result: ModelResponse = {
      content: value['content'],
    }

    if (isRecord(value['additional_kwargs'])) {
      result.additional_kwargs = value['additional_kwargs']
    }

    return result
  }
  return { content: '', additional_kwargs: {} }
}

export class PreAssessmentAgent {
  private jsonParser: PreAssessmentJsonParser

  constructor() {
    this.jsonParser = new PreAssessmentJsonParser()
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
  ): Promise<Result<PreAssessmentWithReasoning, Error>> {
    const allMessages: (BaseMessage | SystemMessage)[] = [
      new SystemMessage(PRE_ASSESSMENT_SYSTEM_MESSAGE),
      ...messages,
    ]

    const model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.1,
    })

    const result = await model.invoke(allMessages)
    const response = toModelResponse(result)

    const parsedReasoning = this.extractReasoning(response)
    const contentStr = this.convertContentToString(response.content)
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
