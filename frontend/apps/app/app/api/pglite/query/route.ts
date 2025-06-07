import { NextResponse } from 'next/server'
import * as v from 'valibot'

const requestSchema = v.object({
  sessionId: v.string(),
  sql: v.string(),
  type: v.union([v.literal('DDL'), v.literal('DML')]),
})

interface TableSchema {
  [tableName: string]: {
    columns: { [columnName: string]: string }
    rows: { [key: string]: unknown }[]
  }
}

interface SessionData {
  tables: TableSchema
  lastAccessed: Date
}

const sessions = new Map<string, SessionData>()

function getOrCreateSession(sessionId: string): SessionData {
  const existing = sessions.get(sessionId)
  if (existing) {
    existing.lastAccessed = new Date()
    return existing
  }

  const sessionData: SessionData = {
    tables: {},
    lastAccessed: new Date(),
  }
  sessions.set(sessionId, sessionData)
  return sessionData
}

function parseCreateTable(
  sql: string,
): { tableName: string; columns: { [key: string]: string } } | null {
  const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(\s*([^)]+)\s*\)/i
  const match = sql.match(createTableRegex)

  if (!match) return null

  const tableName = match[1]
  const columnsStr = match[2]
  const columns: { [key: string]: string } = {}

  const columnDefs = columnsStr.split(',').map((col) => col.trim())
  for (const colDef of columnDefs) {
    const parts = colDef.trim().split(/\s+/)
    if (parts.length >= 2) {
      columns[parts[0]] = parts[1]
    }
  }

  return { tableName, columns }
}

function parseInsert(
  sql: string,
): { tableName: string; values: unknown[] } | null {
  const insertRegex = /INSERT\s+INTO\s+(\w+)\s+VALUES\s*\(([^)]+)\)/i
  const match = sql.match(insertRegex)

  if (!match) return null

  const tableName = match[1]
  const valuesStr = match[2]
  const values = valuesStr.split(',').map((val) => {
    const trimmed = val.trim()
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return trimmed.slice(1, -1)
    }
    if (!Number.isNaN(Number(trimmed))) {
      return Number(trimmed)
    }
    return trimmed
  })

  return { tableName, values }
}

function parseSelect(
  sql: string,
): { tableName: string; columns: string[] } | null {
  const selectRegex = /SELECT\s+(.+?)\s+FROM\s+(\w+)/i
  const match = sql.match(selectRegex)

  if (!match) return null

  const columnsStr = match[1].trim()
  const tableName = match[2]
  const columns =
    columnsStr === '*' ? ['*'] : columnsStr.split(',').map((col) => col.trim())

  return { tableName, columns }
}

interface SqlExecutionResult {
  command: string
  rowCount: number
  rows?: unknown[]
}

function executeSQL(sessionData: SessionData, sql: string): SqlExecutionResult {
  const trimmedSql = sql.trim()

  if (trimmedSql.toUpperCase().startsWith('CREATE TABLE')) {
    const parsed = parseCreateTable(trimmedSql)
    if (parsed) {
      sessionData.tables[parsed.tableName] = {
        columns: parsed.columns,
        rows: [],
      }
      return { command: 'CREATE', rowCount: 0 }
    }
    throw new Error('Invalid CREATE TABLE syntax')
  }

  if (trimmedSql.toUpperCase().startsWith('INSERT INTO')) {
    const parsed = parseInsert(trimmedSql)
    if (parsed && sessionData.tables[parsed.tableName]) {
      const table = sessionData.tables[parsed.tableName]
      const columnNames = Object.keys(table.columns)
      const row: { [key: string]: unknown } = {}

      for (const [index, colName] of columnNames.entries()) {
        row[colName] = parsed.values[index] || null
      }

      table.rows.push(row)
      return { command: 'INSERT', rowCount: 1 }
    }
    throw new Error('Table does not exist or invalid INSERT syntax')
  }

  if (trimmedSql.toUpperCase().startsWith('SELECT')) {
    const parsed = parseSelect(trimmedSql)
    if (parsed && sessionData.tables[parsed.tableName]) {
      const table = sessionData.tables[parsed.tableName]
      const rows = table.rows.map((row) => {
        if (parsed.columns.includes('*')) {
          return row
        }
        const filteredRow: { [key: string]: unknown } = {}
        for (const col of parsed.columns) {
          if (Object.hasOwn(row, col)) {
            filteredRow[col] = row[col]
          }
        }
        return filteredRow
      })
      return { command: 'SELECT', rowCount: rows.length, rows }
    }
    throw new Error('Table does not exist or invalid SELECT syntax')
  }

  throw new Error('Unsupported SQL command')
}

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const parsedRequest = v.safeParse(requestSchema, requestData)

    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 },
      )
    }

    const { sessionId, sql } = parsedRequest.output
    const sessionData = getOrCreateSession(sessionId)

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    const results = []

    for (const statement of statements) {
      const startTime = performance.now()
      try {
        const result = executeSQL(sessionData, statement)
        const executionTime = Math.round(performance.now() - startTime)

        results.push({
          sql: statement,
          result,
          success: true,
          id: crypto.randomUUID(),
          metadata: {
            executionTime,
            timestamp: new Date().toLocaleString(),
            affectedRows: result.rowCount,
          },
        })
      } catch (error) {
        const executionTime = Math.round(performance.now() - startTime)
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        results.push({
          sql: statement,
          result: { error: errorMessage },
          success: false,
          id: crypto.randomUUID(),
          metadata: {
            executionTime,
            timestamp: new Date().toLocaleString(),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('SQL execution error:', error)
    return NextResponse.json(
      { error: 'Query execution failed' },
      { status: 500 },
    )
  }
}
