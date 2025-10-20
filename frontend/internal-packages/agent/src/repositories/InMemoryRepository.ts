import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import type { Schema } from '@liam-hq/schema'
import { schemaSchema } from '@liam-hq/schema'
import { applyPatch } from 'fast-json-patch'
import { errAsync, okAsync, type ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type {
  CreateVersionParams,
  SchemaData,
  SchemaRepository,
  UserInfo,
  VersionResult,
} from './types'

type InMemoryRepositoryState = {
  schemas: Map<string, SchemaData>
  versions: Map<string, { id: string; schema: Schema; versionNumber: number }>
  buildingSchemas: Map<
    string,
    {
      id: string
      designSessionId: string
      organizationId: string
      schema: Schema
      latestVersionNumber: number
      updatedAt: string
    }
  >
}

type InMemoryRepositoryOptions = {
  schemas?: Record<string, Schema>
}

export class InMemoryRepository implements SchemaRepository {
  private state: InMemoryRepositoryState
  public checkpointer: BaseCheckpointSaver
  private idCounter = 1

  constructor(options: InMemoryRepositoryOptions = {}) {
    this.checkpointer = new MemorySaver()
    this.state = {
      schemas: new Map(),
      versions: new Map(),
      buildingSchemas: new Map(),
    }

    Object.entries(options.schemas || {}).forEach(([id, schema]) => {
      this.state.schemas.set(id, {
        id,
        schema,
        latestVersionNumber: 1,
      })

      // Also initialize building schema entry
      this.state.buildingSchemas.set(id, {
        id,
        designSessionId: id, // Use same ID for simplicity
        organizationId: 'demo-org-id',
        schema,
        latestVersionNumber: 1,
        updatedAt: new Date().toISOString(),
      })
    })
  }

  private generateId(): string {
    return `test-id-${this.idCounter++}`
  }

  private isValidSchema(obj: unknown): obj is Schema {
    const result = v.safeParse(schemaSchema, obj)
    return result.success
  }

  getSchema(designSessionId: string): ResultAsync<SchemaData, Error> {
    const schema = this.state.schemas.get(designSessionId)
    if (!schema) {
      return errAsync(
        new Error(
          `Schema not found for ID: ${designSessionId}. Available schemas: ${Array.from(this.state.schemas.keys()).join(', ')}`,
        ),
      )
    }
    return okAsync(schema)
  }

  async createVersion(params: CreateVersionParams): Promise<VersionResult> {
    const schema = this.state.schemas.get(params.buildingSchemaId)

    if (!schema) {
      return { success: false, error: 'Building schema not found' }
    }

    const patchResult = applyPatch(schema.schema, params.patch, false, false)
    const updatedSchema = patchResult.newDocument

    if (!this.isValidSchema(updatedSchema)) {
      return { success: false, error: 'Invalid schema after patch' }
    }

    this.state.schemas.set(params.buildingSchemaId, {
      ...schema,
      schema: updatedSchema,
      latestVersionNumber: params.latestVersionNumber + 1,
    })

    // Also update building schema
    const buildingSchema = this.state.buildingSchemas.get(
      params.buildingSchemaId,
    )
    if (buildingSchema) {
      this.state.buildingSchemas.set(params.buildingSchemaId, {
        ...buildingSchema,
        schema: updatedSchema,
        latestVersionNumber: params.latestVersionNumber + 1,
        updatedAt: new Date().toISOString(),
      })
    }

    return { success: true, newSchema: updatedSchema }
  }

  // Helper method for tests that need to create empty versions
  async createEmptyPatchVersion(params: {
    buildingSchemaId: string
    latestVersionNumber: number
  }): Promise<
    { success: true; versionId: string } | { success: false; error: string }
  > {
    const versionId = this.generateId()
    const schema = this.state.schemas.get(params.buildingSchemaId)

    if (!schema) {
      return { success: false, error: 'Building schema not found' }
    }

    this.state.versions.set(versionId, {
      id: versionId,
      schema: schema.schema,
      versionNumber: params.latestVersionNumber + 1,
    })

    this.state.schemas.set(params.buildingSchemaId, {
      ...schema,
      latestVersionNumber: params.latestVersionNumber + 1,
    })

    return { success: true, versionId }
  }

  // Helper methods for testing
  getCurrentSchema(designSessionId: string): Schema | null {
    const schemaData = this.state.schemas.get(designSessionId)
    return schemaData?.schema || null
  }

  /**
   * Get building schema information (InMemory equivalent of building_schemas table)
   */
  getBuildingSchema(buildingSchemaId: string) {
    return this.state.buildingSchemas.get(buildingSchemaId) || null
  }

  async getUserInfo(userId: string): Promise<UserInfo | null> {
    return {
      id: userId,
      email: `user-${userId}@example.com`,
      userName: `Test User ${userId}`,
    }
  }
}
