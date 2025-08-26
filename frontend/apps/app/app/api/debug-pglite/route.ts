import { executeQuery } from '@liam-hq/pglite-server'
import { NextResponse } from 'next/server'

// Maximum duration for serverless function
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sql = 'SELECT 1 as test' } = body

    console.log('[Debug] Executing SQL:', sql)
    console.log('[Debug] Environment:', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
    })

    const startTime = performance.now()
    const results = await executeQuery(sql)
    const executionTime = performance.now() - startTime

    console.log('[Debug] Execution completed in', executionTime, 'ms')
    console.log('[Debug] Results:', JSON.stringify(results, null, 2))

    return NextResponse.json({
      success: true,
      results,
      executionTime,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
      },
    })
  } catch (error) {
    console.error('[Debug] Error occurred:', error)
    
    // Extract detailed error information
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      // Include any additional error properties
      ...(error instanceof Error && {
        cause: (error as any).cause,
        code: (error as any).code,
      }),
    }

    return NextResponse.json(
      {
        success: false,
        error: errorInfo,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
        },
      },
      { status: 500 }
    )
  }
}

// Also support GET for easy browser testing
export async function GET() {
  const testQueries = [
    'SELECT 1 as simple_test',
    'SELECT version() as pg_version',
    'CREATE TABLE test_table (id INT PRIMARY KEY, name TEXT)',
    "CREATE TYPE test_enum AS ENUM ('value1', 'value2')",
  ]

  const results = []

  for (const sql of testQueries) {
    try {
      const startTime = performance.now()
      const queryResults = await executeQuery(sql)
      const executionTime = performance.now() - startTime

      results.push({
        sql,
        success: true,
        results: queryResults,
        executionTime,
      })
    } catch (error) {
      results.push({
        sql,
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      })
    }
  }

  return NextResponse.json({
    testResults: results,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  })
}