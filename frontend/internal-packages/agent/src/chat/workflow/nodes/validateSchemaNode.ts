import { executeQuery } from '@liam-hq/pglite-server'
import { QAAgent } from '../../../langchain/agents'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'

function extractDMLQueries(response: string): string[] {
  const queries: string[] = []
  const lines = response.split('\n')
  let currentQuery = ''
  let inQuery = false

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine.match(/^(INSERT|UPDATE|DELETE|SELECT)\s+/i)) {
      if (currentQuery.trim()) {
        queries.push(currentQuery.trim())
      }
      currentQuery = line
      inQuery = true
    } else if (inQuery && trimmedLine.endsWith(';')) {
      currentQuery += `\n${line}`
      queries.push(currentQuery.trim())
      currentQuery = ''
      inQuery = false
    } else if (inQuery) {
      currentQuery += `\n${line}`
    }
  }

  if (currentQuery.trim()) {
    queries.push(currentQuery.trim())
  }

  return queries.filter((query) => query.length > 0)
}

async function processValidationQuery(
  query: string,
  state: WorkflowState,
): Promise<{
  query: string
  success: boolean
  resultSet?: string
  errorMessage?: string
}> {
  try {
    const queryResult =
      await state.repositories.validation.createValidationQuery({
        designSessionId: state.designSessionId,
        queryString: query,
      })

    if (!queryResult.success || !queryResult.id) {
      console.error('Failed to save validation query:', queryResult.error)
      return { query, success: false, errorMessage: 'Failed to save query' }
    }

    const sessionId = `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const results = await executeQuery(sessionId, query)

    const success =
      Array.isArray(results) &&
      results.every(
        (result: unknown) =>
          Boolean((result as { success?: boolean }).success) === true,
      )

    const resultSet = JSON.stringify(results)
    const errorMessage = success ? null : getErrorMessage(results)

    await state.repositories.validation.createValidationResult({
      validationQueryId: queryResult.id,
      resultSet: success ? resultSet : null,
      status: success ? 'success' : 'failure',
      errorMessage,
    })

    if (success) {
      return { query, success, resultSet }
    }
    return { query, success, ...(errorMessage && { errorMessage }) }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { query, success: false, errorMessage }
  }
}

function getErrorMessage(results: unknown): string {
  if (Array.isArray(results)) {
    const failedResult = results.find(
      (r: unknown) => !(r as { success?: boolean }).success,
    ) as { error?: string }
    return failedResult?.error || 'Unknown error'
  }
  return 'Query execution failed'
}

/**
 * Validate Schema Node - Use Case Verification & DML Execution
 * Performed by qaAgent
 */
export async function validateSchemaNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  try {
    if (!state.brd || state.brd.length === 0) {
      state.onProgress?.('❌ BRD情報が不足しています')
      return { ...state, error: 'No BRD available for schema validation' }
    }

    state.onProgress?.('🔍 QA Agent: スキーマ検証を開始しています...')

    const qaAgent = new QAAgent()
    const schemaText = convertSchemaToText(state.schemaData)
    const chatHistory = state.history.join('\n')
    const brdRequirements = state.brd.join('\n')

    state.onProgress?.('📋 BRD要件を分析中...')

    const response = await qaAgent.generate({
      schema_text: schemaText,
      chat_history: chatHistory,
      user_message: state.userInput,
      brd_requirements: brdRequirements,
    })

    state.onProgress?.('⚡ DMLクエリを生成中...')

    const dmlQueries = extractDMLQueries(response)

    if (dmlQueries.length === 0) {
      state.onProgress?.('❌ DMLクエリの生成に失敗しました')
      return { ...state, error: 'No DML queries generated for validation' }
    }

    const queryTypes = {
      INSERT: dmlQueries.filter(q => q.trim().toUpperCase().startsWith('INSERT')).length,
      UPDATE: dmlQueries.filter(q => q.trim().toUpperCase().startsWith('UPDATE')).length,
      DELETE: dmlQueries.filter(q => q.trim().toUpperCase().startsWith('DELETE')).length,
      SELECT: dmlQueries.filter(q => q.trim().toUpperCase().startsWith('SELECT')).length,
    }

    state.onProgress?.(`✅ DMLクエリ生成完了: INSERT(${queryTypes.INSERT}) UPDATE(${queryTypes.UPDATE}) DELETE(${queryTypes.DELETE}) SELECT(${queryTypes.SELECT})`)

    state.onProgress?.('🚀 クエリ実行を開始...')

    const validationResults: Array<{
      query: string
      success: boolean
      resultSet?: string
      errorMessage?: string
    }> = []

    for (let i = 0; i < dmlQueries.length; i++) {
      const query = dmlQueries[i]
      state.onProgress?.(`⏳ クエリ実行中... (${i + 1}/${dmlQueries.length})`)
      
      const result = await processValidationQuery(query, state)
      validationResults.push(result)

      if (result.success) {
        state.onProgress?.(`✅ クエリ ${i + 1}: 実行成功`)
      } else {
        state.onProgress?.(`❌ クエリ ${i + 1}: 実行失敗 - ${result.errorMessage || 'Unknown error'}`)
      }
    }

    const successCount = validationResults.filter(r => r.success).length
    const failureCount = validationResults.length - successCount
    const hasFailures = failureCount > 0

    if (hasFailures) {
      state.onProgress?.(`⚠️ 検証完了: ${successCount}個成功, ${failureCount}個失敗`)
    } else {
      state.onProgress?.(`🎉 検証完了: 全${successCount}個のクエリが成功しました!`)
    }

    // 外部キー制約とデータ整合性のチェック結果を分析
    const constraintTests = validationResults.filter(r => 
      r.errorMessage?.includes('constraint') || 
      r.errorMessage?.includes('foreign key') ||
      r.errorMessage?.includes('unique')
    )
    
    if (constraintTests.length > 0) {
      const constraintSuccesses = constraintTests.filter(r => r.success).length
      state.onProgress?.(`🔗 制約テスト: ${constraintSuccesses}/${constraintTests.length}個成功`)
    }

    return {
      ...state,
      validationQueries: dmlQueries,
      validationResults,
      error: hasFailures
        ? 'Schema validation failed - some queries could not execute successfully'
        : undefined,
      retryCount: state.retryCount || 0,
    }
  } catch (error) {
    console.error('Error in validateSchemaNode:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    state.onProgress?.(`💥 検証エラー: ${errorMessage}`)
    return {
      ...state,
      error: `Failed to validate schema: ${errorMessage}`,
      retryCount: state.retryCount || 0,
    }
  }
}
