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

      console.log('🔍 Running test coverage...')
      await execAsync('pnpm test:coverage', {
        cwd: rootDir,
      })

      const sourcePath = join(rootDir, 'coverage/coverage-final.json')
      copyFileSync(sourcePath, coverageFile)
      console.log('✅ Coverage data saved to dist/coverage.json\n')

      console.log('📊 Analyzing coverage data...')
      const coverageData = JSON.parse(readFileSync(coverageFile, 'utf-8'))

      console.log('🤖 AI分析レポートを生成中...')
      const analyzer = new TestStrategyAnalyzer()
      const detailedReport = await analyzer.generateDetailedReport(coverageData)

      console.log('\n' + '='.repeat(80))
      console.log('📊 FRONTEND テストバランス分析レポート')
      console.log('='.repeat(80))
      console.log(detailedReport)

      const reportFile = join(outputDir, 'frontend-test-balance-report.md')
      writeFileSync(reportFile, detailedReport, 'utf-8')
      console.log(`\n📄 詳細レポート保存: ${reportFile}`)
    } catch (error) {
      console.error('Failed to run coverage:', error)
      process.exit(1)
    }
  })
