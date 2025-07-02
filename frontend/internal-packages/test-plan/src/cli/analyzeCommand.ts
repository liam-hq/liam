import 'dotenv/config'
import { exec } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { Command } from 'commander'
import { TestStrategyAnalyzer } from '../llm/openaiClient.js'

const execAsync = promisify(exec)

export const analyzeCommand = new Command('analyze')
  .description('Analyze test coverage and strategy')
  .action(async () => {
    try {
      const rootDir = join(process.cwd(), '../../../')
      const outputDir = join(process.cwd(), 'dist')
      const coverageFile = join(outputDir, 'coverage.json')

      mkdirSync(outputDir, { recursive: true })

      console.info('🔍 Running test coverage...')
      await execAsync('pnpm test:coverage', {
        cwd: rootDir,
      })

      const sourcePath = join(rootDir, 'coverage/coverage-final.json')
      copyFileSync(sourcePath, coverageFile)
      console.info('✅ Coverage data saved to dist/coverage.json\n')

      console.info('📊 Analyzing coverage data...')
      const coverageData = JSON.parse(readFileSync(coverageFile, 'utf-8'))

      const specPath = join(rootDir, 'SPEC.md')
      let projectSpec: string | undefined

      try {
        projectSpec = readFileSync(specPath, 'utf-8')
        console.info('📋 Project specification loaded from SPEC.md')
      } catch (error) {
        console.warn('⚠️  SPEC.md not found, proceeding without project context')
      }

      console.info('🤖 Generating AI analysis report...')
      const analyzer = new TestStrategyAnalyzer()
      const detailedReport = await analyzer.generateDetailedReport(
        coverageData,
        projectSpec,
      )

      console.info(`\n${'='.repeat(80)}`)
      console.info('📊 FRONTEND Test Balance Analysis Report')
      console.info('='.repeat(80))
      console.info(detailedReport)

      const reportFile = join(outputDir, 'frontend-test-balance-report.md')
      writeFileSync(reportFile, detailedReport, 'utf-8')
      console.info(`\n📄 Detailed report saved: ${reportFile}`)
    } catch (error) {
      console.error('Failed to run coverage:', error)
      process.exit(1)
    }
  })
