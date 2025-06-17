'use client'
import type { Schema } from '@liam-hq/db-structure'
import { schemaSchema } from '@liam-hq/db-structure'
import {
  type FC,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from 'react'
import * as v from 'valibot'
import {
  fetchSchemaDataClient,
  setupBuildingSchemaRealtimeSubscription,
} from '../services/buildingSchemaServiceClient'

type SchemaContextValue = {
  schema: Schema | null
  isLoadingSchema: boolean
}

const SchemaContext = createContext<SchemaContextValue | undefined>(undefined)

type SchemaProviderProps = {
  children: ReactNode
  designSessionId: string
}

export const SchemaProvider: FC<SchemaProviderProps> = ({
  children,
  designSessionId,
}) => {
  const [schema, setSchema] = useState<Schema | null>(null)
  const [isLoadingSchema, startTransition] = useTransition()

  // Load initial schema data
  useEffect(() => {
    const loadInitialSchema = async () => {
      startTransition(async () => {
        try {
          const { data: schemaData, error } =
            await fetchSchemaDataClient(designSessionId)

          if (error) {
            console.error('Failed to fetch initial schema:', error)
            return
          }

          if (schemaData.schema) {
            const schema = v.parse(schemaSchema, schemaData.schema)
            setSchema(schema)
          }
        } catch (error) {
          console.error('Error loading initial schema:', error)
        }
      })
    }

    if (designSessionId) {
      loadInitialSchema()
    }
  }, [designSessionId])

  // Handle schema updates from realtime subscription
  const handleSchemaUpdate = useCallback(
    async (triggeredDesignSessionId: string) => {
      try {
        const { data: schemaData, error } = await fetchSchemaDataClient(
          triggeredDesignSessionId,
        )

        if (error) {
          console.error('Failed to fetch updated schema:', error)
          return
        }

        if (schemaData.schema) {
          const schema = v.parse(schemaSchema, schemaData.schema)
          setSchema(schema)
        }
      } catch (error) {
        console.error('Error handling schema update:', error)
      }
    },
    [],
  )

  // Handle realtime subscription errors
  const handleRealtimeError = useCallback((_error: Error) => {
    // TODO: Add user notification system
    // console.error('Schema realtime subscription error:', error)
  }, [])

  // Set up realtime subscription for schema updates
  useEffect(() => {
    if (!designSessionId) {
      return
    }

    const subscription = setupBuildingSchemaRealtimeSubscription(
      designSessionId,
      handleSchemaUpdate,
      handleRealtimeError,
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [designSessionId, handleSchemaUpdate, handleRealtimeError])

  return (
    <SchemaContext.Provider value={{ schema, isLoadingSchema }}>
      {children}
    </SchemaContext.Provider>
  )
}

export const useSchema = () => {
  const context = useContext(SchemaContext)
  if (context === undefined) {
    throw new Error('useSchema must be used within a SchemaProvider')
  }
  return context
}
