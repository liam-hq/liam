import { isSchemaUpdated } from '../vectorstore/supabaseVectorStore'
import { syncSchemaVectorStore } from '../vectorstore/syncSchemaVectorStore'
import { executeChatWorkflow } from './workflow'
import type { Schema } from '@liam-hq/db-structure'

interface ChatProcessorParams {
  userInput: string
  history: string[]
  schemaData: Schema
  mode: 'Ask' | 'Build'
  projectId?: string
  buildingSchemaId: string
  latestVersionNumber?: number
  organizationId?: string
  userId?: string
}

export async function processChatMessage(params: ChatProcessorParams) {
  const {
    userInput,
    history,
    schemaData,
    mode,
    projectId,
    buildingSchemaId,
    latestVersionNumber,
    organizationId,
    userId,
  } = params

  try {
    if (organizationId) {
      const needsVectorStoreUpdate = await isSchemaUpdated(schemaData)
      if (needsVectorStoreUpdate) {
        await syncSchemaVectorStore(schemaData, organizationId)
      }
    }

    const initialState = {
      mode,
      userInput,
      history,
      schemaData,
      projectId,
      buildingSchemaId,
      latestVersionNumber,
      organizationId,
      userId,
    }

    return executeChatWorkflow(initialState)
  } catch (error) {
    throw new Error(
      `Chat processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
