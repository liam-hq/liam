'use client'

import { executeQuery } from '@liam-hq/pglite-server'
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { DDLInputSection } from './DDLInputSection'
import { DMLInputSection } from './DMLInputSection'
import styles from './PGlitePlayground.module.css'
import type { DDLState, DMLSection, SqlResult } from './utils/types'

/**
 * PGlitePlayground Handle Interface
 *
 * This interface provides methods to control the PGlitePlayground component imperatively
 * from parent components through a ref.
 *
 * @example
 * ```tsx
 * import { useRef } from 'react';
 * import { PGlitePlayground, PGlitePlaygroundHandle } from '@/components/PGlitePage';
 *
 * function ParentComponent() {
 *   const ref = useRef<PGlitePlaygroundHandle>(null);
 *
 *   // LLM agent example
 *   const handleAgentCommand = async () => {
 *     // Insert DDL statement and execute it
 *     await ref.current?.insertDDL("CREATE TABLE users (id INT);");
 *
 *     // Add a new DML section with a query and execute it
 *     await ref.current?.addDMLWithQuery("INSERT INTO users VALUES (1);");
 *
 *     // Get results from the first DML section
 *     const result = ref.current?.getDMLResults(0);
 *     // Process the results as needed
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleAgentCommand}>Run Agent Command</button>
 *       <PGlitePlayground ref={ref} />
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * Interface for the PGlitePlayground component's imperative handle
 * Provides methods for external control of the playground
 */
export interface PGlitePlaygroundHandle {
  /**
   * Inserts DDL and executes it immediately.
   * Supports multiple statements.
   */
  insertDDL: (ddl: string) => Promise<void>

  /**
   * Adds a new DML section with the specified query and executes it.
   */
  addDMLWithQuery: (query: string) => Promise<void>

  /**
   * Updates the query in a specific DML section (by index) and executes it.
   */
  updateDMLQueryAt: (index: number, query: string) => Promise<void>

  /**
   * Returns the current session ID for the global database.
   */
  getSessionId: () => string

  /**
   * Returns the DDL execution results (cumulative).
   */
  getDDLResults: () => SqlResult[]

  /**
   * Returns the execution results for a specific DML section.
   * Returns null if the index is invalid.
   */
  getDMLResults: (index: number) => SqlResult[] | null
}

export const PGlitePlayground = ({
  ref,
}: {
  ref: Ref<PGlitePlaygroundHandle>
}) => {
  const [sessionId] = useState<string>(() => crypto.randomUUID())
  const [isConnected, setIsConnected] = useState<boolean>(false)

  // DDL section state
  const [ddlState, setDdlState] = useState<DDLState>({
    ddlInput: '',
    results: [],
  })

  // DML sections state (multiple)
  const [dmlSections, setDmlSections] = useState<DMLSection[]>([])

  // Add DML section
  const addDMLSection = useCallback(async () => {
    setDmlSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        dmlInput: '',
        results: [],
        db: null, // No longer needed as we use server-side instances
      },
    ])
  }, [])

  // Initialization
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        await executeQuery(sessionId, 'SELECT 1')
        setIsConnected(true)

        // Add one initial DML section
        addDMLSection()
      } catch (error) {
        console.error('Failed to initialize PGlite connection:', error)
        setIsConnected(false)
      }
    }

    initializeConnection()
  }, [sessionId, addDMLSection])

  // Update DDL input
  const updateDdlInput = (value: string) => {
    setDdlState((prev) => ({
      ...prev,
      ddlInput: value,
    }))
  }

  // Update DML input
  const updateDmlInput = (sectionId: string, value: string) => {
    setDmlSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, dmlInput: value } : section,
      ),
    )
  }

  // Execute DDL
  const executeDDL = async () => {
    if (!isConnected || !ddlState.ddlInput.trim()) return

    try {
      // Execute DDL using server-side PGlite instance
      const results = await executeQuery(sessionId, ddlState.ddlInput)
      setDdlState((prev) => ({
        ...prev,
        results: [...prev.results, ...results],
      }))
    } catch (error) {
      console.error('DDL execution failed:', error)
      const errorResult: SqlResult = {
        sql: ddlState.ddlInput,
        result: {
          error: error instanceof Error ? error.message : String(error),
        },
        success: false,
        id: crypto.randomUUID(),
        metadata: {
          executionTime: 0,
          timestamp: new Date().toLocaleString(),
        },
      }
      setDdlState((prev) => ({
        ...prev,
        results: [...prev.results, errorResult],
      }))
    }
  }

  // Execute DML (for a specific section)
  const executeDML = async (sectionId: string) => {
    const sectionIndex = dmlSections.findIndex((s) => s.id === sectionId)
    if (sectionIndex === -1) return

    const section = dmlSections[sectionIndex]
    if (!isConnected || !section.dmlInput.trim()) return

    try {
      // Execute DML using server-side PGlite instance
      const results = await executeQuery(sessionId, section.dmlInput)

      setDmlSections((prev) => {
        const newSections = [...prev]
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          results: [...newSections[sectionIndex].results, ...results],
          dmlInput: '', // Clear input
        }
        return newSections
      })
    } catch (error) {
      console.error('DML execution failed:', error)
      const errorResult: SqlResult = {
        sql: section.dmlInput,
        result: {
          error: error instanceof Error ? error.message : String(error),
        },
        success: false,
        id: crypto.randomUUID(),
        metadata: {
          executionTime: 0,
          timestamp: new Date().toLocaleString(),
        },
      }

      setDmlSections((prev) => {
        const newSections = [...prev]
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          results: [...newSections[sectionIndex].results, errorResult],
          dmlInput: '', // Clear input
        }
        return newSections
      })
    }
  }

  // Remove DML section
  const removeDMLSection = (sectionId: string) => {
    setDmlSections((prev) => prev.filter((section) => section.id !== sectionId))
  }

  // Expose imperative methods via ref
  useImperativeHandle(
    ref,
    () => ({
      // Insert and execute DDL
      insertDDL: async (ddl: string) => {
        if (!isConnected) return

        // Update DDL input
        setDdlState((prev) => ({
          ...prev,
          ddlInput: ddl,
        }))

        try {
          // Execute DDL using server-side PGlite instance
          const results = await executeQuery(sessionId, ddl)
          setDdlState((prev) => ({
            ...prev,
            results: [...prev.results, ...results],
          }))
        } catch (error) {
          console.error('DDL execution failed:', error)
          const errorResult: SqlResult = {
            sql: ddl,
            result: {
              error: error instanceof Error ? error.message : String(error),
            },
            success: false,
            id: crypto.randomUUID(),
            metadata: {
              executionTime: 0,
              timestamp: new Date().toLocaleString(),
            },
          }
          setDdlState((prev) => ({
            ...prev,
            results: [...prev.results, errorResult],
          }))
        }
      },

      // Add new DML section with query and execute
      addDMLWithQuery: async (query: string) => {
        if (!isConnected) return

        const newSectionId = crypto.randomUUID()

        // Add new section
        setDmlSections((prev) => [
          ...prev,
          {
            id: newSectionId,
            dmlInput: query,
            results: [],
            db: null, // No longer needed
          },
        ])

        try {
          // Execute the query using server-side PGlite instance
          const results = await executeQuery(sessionId, query)

          setDmlSections((prev) => {
            const sectionIndex = prev.findIndex((s) => s.id === newSectionId)
            if (sectionIndex === -1) return prev

            const newSections = [...prev]
            newSections[sectionIndex] = {
              ...newSections[sectionIndex],
              results,
              dmlInput: '', // Clear input after execution
            }
            return newSections
          })
        } catch (error) {
          console.error('DML execution failed:', error)
          const errorResult: SqlResult = {
            sql: query,
            result: {
              error: error instanceof Error ? error.message : String(error),
            },
            success: false,
            id: crypto.randomUUID(),
            metadata: {
              executionTime: 0,
              timestamp: new Date().toLocaleString(),
            },
          }

          setDmlSections((prev) => {
            const sectionIndex = prev.findIndex((s) => s.id === newSectionId)
            if (sectionIndex === -1) return prev

            const newSections = [...prev]
            newSections[sectionIndex] = {
              ...newSections[sectionIndex],
              results: [errorResult],
              dmlInput: '', // Clear input after execution
            }
            return newSections
          })
        }
      },

      // Update and execute query in specific DML section
      updateDMLQueryAt: async (index: number, query: string) => {
        if (index < 0 || index >= dmlSections.length || !isConnected) return

        // Update the query
        setDmlSections((prev) => {
          const newSections = [...prev]
          newSections[index] = {
            ...newSections[index],
            dmlInput: query,
          }
          return newSections
        })

        try {
          // Execute the query using server-side PGlite instance
          const results = await executeQuery(sessionId, query)

          setDmlSections((prev) => {
            const newSections = [...prev]
            newSections[index] = {
              ...newSections[index],
              results: [...newSections[index].results, ...results],
              dmlInput: '', // Clear input after execution
            }
            return newSections
          })
        } catch (error) {
          console.error('DML execution failed:', error)
          const errorResult: SqlResult = {
            sql: query,
            result: {
              error: error instanceof Error ? error.message : String(error),
            },
            success: false,
            id: crypto.randomUUID(),
            metadata: {
              executionTime: 0,
              timestamp: new Date().toLocaleString(),
            },
          }

          setDmlSections((prev) => {
            const newSections = [...prev]
            newSections[index] = {
              ...newSections[index],
              results: [...newSections[index].results, errorResult],
              dmlInput: '', // Clear input after execution
            }
            return newSections
          })
        }
      },

      getSessionId: () => sessionId,

      // Get DDL results
      getDDLResults: () => ddlState.results,

      // Get DML results for specific section
      getDMLResults: (index: number) => {
        if (index < 0 || index >= dmlSections.length) return null
        return dmlSections[index].results
      },
    }),
    [sessionId, isConnected, ddlState, dmlSections],
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PGlite Playground</h1>

      <div
        className={`${styles.status} ${isConnected ? styles.success : styles.loading}`}
      >
        {isConnected
          ? 'PGlite Database Connected'
          : 'PGlite Database Connecting...'}
      </div>

      {/* DDL Input Section (Global) - Componentized */}
      <DDLInputSection
        ddlState={ddlState}
        updateDdlInput={updateDdlInput}
        executeDDL={executeDDL}
      />

      <div className={styles.divider} />

      {/* DML Sections (Multiple) */}
      <div className={styles.playgroundSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>DML Use Case Section</h2>
        </div>
        <p className={styles.description}>
          Each DML form runs in an isolated environment. Results are not
          affected by other forms' executions.
        </p>

        {dmlSections.map((section) => {
          // Use DMLInputSection component
          return (
            <DMLInputSection
              key={section.id}
              section={section}
              updateDmlInput={updateDmlInput}
              executeDML={executeDML}
              removeDMLSection={removeDMLSection}
            />
          )
        })}

        {/* Add DML Form Button */}
        <button
          type="button"
          onClick={() => addDMLSection()}
          className={`${styles.actionButton} ${styles.secondaryButton}`}
        >
          ＋ Add DML Form
        </button>
      </div>
    </div>
  )
}

// Add display name for debugging
PGlitePlayground.displayName = 'PGlitePlayground'
