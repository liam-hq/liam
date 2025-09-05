import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fromThrowable } from '@liam-hq/neverthrow'
import type { Result } from 'neverthrow'

/**
 * Environment information for enhanced tracing
 */
type TraceEnvironmentInfo = {
  runtime: {
    name: string
    version: string
    platform: string
    arch: string
  }

  environment: {
    name: string
    region?: string | undefined
    nodeEnv?: string | undefined
  }

  developer: {
    username: string
    hostname: string
    timezone: string
  }

  git: {
    branch: string
    commit: string
  }
}

/**
 * LangGraph specific trace metadata
 */
type LangGraphTraceMetadata = {
  langgraph: {
    version: string
    execution_id: string
    workflow_run_id?: string | undefined
    graph_name?: string | undefined
  }
}

/**
 * Get current Git branch safely using Result type
 */
const getCurrentBranch = (): Result<string, Error> => {
  return fromThrowable(() => {
    return execSync('git branch --show-current', {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  })()
}

/**
 * Get current Git commit hash safely using Result type
 */
const getCurrentCommit = (): Result<string, Error> => {
  return fromThrowable(() => {
    return execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .slice(0, 8)
  })()
}

/**
 * Get LangGraph version from package.json using Result type
 */
const getLangGraphVersion = (): Result<string, Error> => {
  return fromThrowable(() => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json')
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
    const packageJson: { dependencies?: Record<string, string> } =
      JSON.parse(packageJsonContent)
    return packageJson.dependencies?.['@langchain/langgraph'] ?? 'unknown'
  })()
}

/**
 * Get environment name with proper preview/production detection
 */
const getEnvironmentName = (): string => {
  const nextPublicEnv = process.env['NEXT_PUBLIC_ENV_NAME']
  if (nextPublicEnv) {
    return nextPublicEnv
  }

  return process.env['NODE_ENV'] || 'development'
}

/**
 * Collect all environment information
 */
const collectEnvironmentInfo = (): TraceEnvironmentInfo => {
  return {
    runtime: {
      name: 'node',
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    environment: {
      name: getEnvironmentName(),
      region: process.env['VERCEL_REGION'] || process.env['AWS_REGION'],
      nodeEnv: process.env['NODE_ENV'],
    },
    developer: {
      username: process.env['USER'] || process.env['USERNAME'] || 'unknown',
      hostname: os.hostname(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    git: {
      branch: getCurrentBranch().unwrapOr('unknown'),
      commit: getCurrentCommit().unwrapOr('unknown'),
    },
  }
}

/**
 * Generate environment-based tags
 */
const generateEnvironmentTags = (): string[] => {
  const envInfo = collectEnvironmentInfo()

  return [
    `environment:${envInfo.environment.name}`,
    `runtime:${envInfo.runtime.name}_${envInfo.runtime.version}`,
    `platform:${envInfo.runtime.platform}`,
    `developer:${envInfo.developer.username}`,
    `git_branch:${envInfo.git.branch}`,
    'langgraph',
  ].filter((tag) => !tag.includes('unknown'))
}

/**
 * Create enhanced trace data with environment context
 */
export const createEnhancedTraceData = (
  workflowRunId?: string,
  graphName?: string,
  additionalTags: string[] = [],
  additionalMetadata: Record<string, unknown> = {},
): { tags: string[]; metadata: Record<string, unknown> } => {
  const environmentInfo = collectEnvironmentInfo()
  const environmentTags = generateEnvironmentTags()

  const langGraphMetadata: LangGraphTraceMetadata = {
    langgraph: {
      version: getLangGraphVersion().unwrapOr('unknown'),
      execution_id: randomUUID(),
      workflow_run_id: workflowRunId,
      graph_name: graphName,
    },
  }

  const allTags = [
    ...environmentTags,
    ...additionalTags,
    ...(graphName ? [`graph:${graphName}`] : []),
  ]

  const allMetadata = {
    ...environmentInfo,
    ...langGraphMetadata,
    ...additionalMetadata,
  }

  return {
    tags: allTags,
    metadata: allMetadata,
  }
}
