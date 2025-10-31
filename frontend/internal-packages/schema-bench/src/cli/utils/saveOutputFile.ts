import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fromPromise, type Result } from '@liam-hq/neverthrow'

type ArchiveOptions = {
  archiveRunId?: string
  executor?: string // e.g., 'liamdb' | 'openai'
}

/**
 * Save output JSON for a case under execution/output (overwrites latest).
 */
export async function saveOutputFile(
  datasetPath: string,
  caseId: string,
  output: unknown,
  options?: ArchiveOptions,
): Promise<Result<void, Error>> {
  const outputDir = join(datasetPath, 'execution/output')
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  // If archiving is requested, write a copy under runs/<RUN_ID>(--<executor>)/
  if (options?.archiveRunId) {
    const runDirName = options.executor
      ? `${options.archiveRunId}--${options.executor}`
      : options.archiveRunId
    const archiveDir = join(outputDir, 'runs', runDirName)
    if (!existsSync(archiveDir)) {
      mkdirSync(archiveDir, { recursive: true })
    }
    const archivePath = join(archiveDir, `${caseId}.json`)
    const archiveResult = await fromPromise(
      writeFile(archivePath, JSON.stringify(output, null, 2)),
      (error) =>
        error instanceof Error
          ? error
          : new Error(`Failed to archive output for ${caseId}`),
    )
    if (archiveResult.isErr()) {
      return archiveResult
    }
  }

  const latestPath = join(outputDir, `${caseId}.json`)
  const latestResult = await fromPromise(
    writeFile(latestPath, JSON.stringify(output, null, 2)),
    (error) =>
      error instanceof Error
        ? error
        : new Error(`Failed to write latest output for ${caseId}`),
  )

  return latestResult.map(() => undefined)
}
