'use client'

import { PGlite } from '@electric-sql/pglite'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { DDLInputSection } from './DDLInputSection'
import { DMLInputSection } from './DMLInputSection'
import styles from './PGlitePlayground.module.css'
import { applyDDL, applyDML } from './utils'
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
 *     console.log(result);
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
   * Returns the current global database instance (for DDL).
   */
  getGlobalDb: () => PGlite | null

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

export const PGlitePlayground = forwardRef<PGlitePlaygroundHandle>((_, ref) => {
  // Global DB (for DDL)
  const [globalDb, setGlobalDb] = useState<PGlite | null>(null)

  // DDL section state
  const [ddlState, setDdlState] = useState<DDLState>({
    ddlInput: '',
    results: [],
  })

  // DML sections state (multiple)
  const [dmlSections, setDmlSections] = useState<DMLSection[]>([])

  // Add DML section
  const addDMLSection = useCallback(
    async (initialDb?: PGlite) => {
      const newDb = initialDb || new PGlite()

      // Apply current DDL to the new DB instance
      if (ddlState.ddlInput) {
        await applyDDL(ddlState.ddlInput, newDb)
      }

      setDmlSections((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          dmlInput: '',
          results: [],
          db: newDb,
        },
      ])
    },
    [ddlState.ddlInput],
  )

  // Initialization
  useEffect(() => {
    const initializeDb = async () => {
      const db = new PGlite()
      setGlobalDb(db)

      // Add one initial DML section
      addDMLSection(db)
    }

    initializeDb()
  }, [addDMLSection])

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
    if (!globalDb || !ddlState.ddlInput.trim()) return

    // Execute DDL and save results
    const results = await applyDDL(ddlState.ddlInput, globalDb)
    setDdlState((prev) => ({
      ...prev,
      results: [...prev.results, ...results],
    }))

    // After DDL execution, update all DML section DBs
    await updateAllDmlSections()
  }

  // Update all DML section DBs (after DDL changes)
  const updateAllDmlSections = useCallback(
    async (ddlOverride?: string) => {
      if (!globalDb) return

      const ddlToApply =
        ddlOverride !== undefined ? ddlOverride : ddlState.ddlInput

      // Create new DB instances for each DML section and apply DDL
      const updatedSections = await Promise.all(
        dmlSections.map(async (section) => {
          const newDb = new PGlite()

          // Apply current DDL to the new DB instance
          if (ddlToApply) {
            await applyDDL(ddlToApply, newDb)
          }

          return {
            ...section,
            db: newDb,
          }
        }),
      )

      setDmlSections(updatedSections)
    },
    [globalDb, ddlState.ddlInput, dmlSections],
  )

  // Execute DML (for a specific section)
  const executeDML = async (sectionId: string) => {
    const sectionIndex = dmlSections.findIndex((s) => s.id === sectionId)
    if (sectionIndex === -1) return

    const section = dmlSections[sectionIndex]
    if (!section.db || !section.dmlInput.trim()) return

    // Execute DML and save results
    const results = await applyDML(section.dmlInput, section.db)

    setDmlSections((prev) => {
      const newSections = [...prev]
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        results: [...newSections[sectionIndex].results, ...results],
        dmlInput: '', // Clear input
      }
      return newSections
    })
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
        if (!globalDb) return

        // Update DDL input
        setDdlState((prev) => ({
          ...prev,
          ddlInput: ddl,
        }))

        // Execute DDL and save results
        const results = await applyDDL(ddl, globalDb)
        setDdlState((prev) => ({
          ...prev,
          results: [...prev.results, ...results],
        }))

        // Update all DML section DBs
        await updateAllDmlSections(ddl)
      },

      // Add new DML section with query and execute
      addDMLWithQuery: async (query: string) => {
        if (!globalDb) return

        const newDb = new PGlite()

        // Apply current DDL to the new DB instance
        if (ddlState.ddlInput) {
          await applyDDL(ddlState.ddlInput, newDb)
        }

        const newSectionId = crypto.randomUUID()

        // Add new section
        setDmlSections((prev) => [
          ...prev,
          {
            id: newSectionId,
            dmlInput: query,
            results: [],
            db: newDb,
          },
        ])

        // Execute the query in the new section
        const results = await applyDML(query, newDb)

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
      },

      // Update and execute query in specific DML section
      updateDMLQueryAt: async (index: number, query: string) => {
        if (index < 0 || index >= dmlSections.length || !globalDb) return

        const section = dmlSections[index]

        if (!section.db) return

        // Update the query
        setDmlSections((prev) => {
          const newSections = [...prev]
          newSections[index] = {
            ...newSections[index],
            dmlInput: query,
          }
          return newSections
        })

        // Execute the query
        const results = await applyDML(query, section.db)

        setDmlSections((prev) => {
          const newSections = [...prev]
          newSections[index] = {
            ...newSections[index],
            results: [...newSections[index].results, ...results],
            dmlInput: '', // Clear input after execution
          }
          return newSections
        })
      },

      // Get global DB instance
      getGlobalDb: () => globalDb,

      // Get DDL results
      getDDLResults: () => ddlState.results,

      // Get DML results for specific section
      getDMLResults: (index: number) => {
        if (index < 0 || index >= dmlSections.length) return null
        return dmlSections[index].results
      },
    }),
    [globalDb, ddlState, dmlSections, updateAllDmlSections],
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PGlite Playground</h1>

      <div
        className={`${styles.status} ${globalDb ? styles.success : styles.loading}`}
      >
        {globalDb
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
})

// Add display name for debugging
PGlitePlayground.displayName = 'PGlitePlayground'
