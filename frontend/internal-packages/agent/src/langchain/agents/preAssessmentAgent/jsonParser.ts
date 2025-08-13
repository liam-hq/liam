import { err, ok, type Result, ResultAsync } from 'neverthrow'
import * as v from 'valibot'

const preAssessmentResponseSchema = v.strictObject({
  decision: v.picklist(['irrelevant', 'insufficient', 'sufficient']),
  reasoning: v.string(),
  response: v.string(),
})

export type PreAssessmentResponse = v.InferOutput<
  typeof preAssessmentResponseSchema
>

type JsonParserState = {
  braceCount: number
  inString: boolean
  escaped: boolean
}

export class PreAssessmentJsonParser {
  private processJsonChar(char: string, state: JsonParserState): boolean {
    if (state.escaped) {
      state.escaped = false
      return false
    }

    if (char === '\\' && state.inString) {
      state.escaped = true
      return false
    }

    if (char === '"' && !state.escaped) {
      state.inString = !state.inString
      return false
    }

    if (!state.inString) {
      if (char === '{') {
        state.braceCount++
      } else if (char === '}') {
        state.braceCount--
        return state.braceCount === 0
      }
    }

    return false
  }

  private extractBalancedJson(content: string): string | null {
    const startIndex = content.indexOf('{')
    if (startIndex === -1) return null

    const state: JsonParserState = {
      braceCount: 0,
      inString: false,
      escaped: false,
    }

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i]
      if (!char) continue
      const isComplete = this.processJsonChar(char, state)

      if (isComplete) {
        return content.substring(startIndex, i + 1)
      }
    }

    return null
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  private extractDataFromWrapper(value: unknown): unknown {
    if (!this.isRecord(value)) {
      return value
    }

    if ('value' in value && typeof value['value'] === 'object') {
      return value['value']
    }
    if ('response' in value && typeof value['response'] === 'object') {
      return value['response']
    }
    if ('assessment' in value && typeof value['assessment'] === 'object') {
      return value['assessment']
    }

    return value
  }

  async parseResponse(
    content: string,
  ): Promise<Result<PreAssessmentResponse, Error>> {
    let jsonStr: string | null = null

    const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch?.[1]?.trim()) {
      jsonStr = codeBlockMatch[1].trim()
    }

    if (!jsonStr) {
      const genericCodeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/)
      if (genericCodeBlockMatch?.[1]?.trim()) {
        const candidate = genericCodeBlockMatch[1].trim()
        if (candidate.startsWith('{') && candidate.endsWith('}')) {
          jsonStr = candidate
        }
      }
    }

    if (!jsonStr) {
      jsonStr = this.extractBalancedJson(content)
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
        return err(new Error(`JSON parsing failed: ${error.message}`))
      },
    )

    if (parsed.isErr()) {
      return parsed
    }

    const dataToValidate = this.extractDataFromWrapper(parsed.value)

    const assessmentResult = v.safeParse(
      preAssessmentResponseSchema,
      dataToValidate,
    )

    if (!assessmentResult.success) {
      return err(
        new Error(
          `Validation failed: ${JSON.stringify(assessmentResult.issues)}`,
        ),
      )
    }

    return ok(assessmentResult.output)
  }
}
