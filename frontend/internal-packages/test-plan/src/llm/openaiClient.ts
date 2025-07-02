// src/llm/openaiClient.ts
/** biome-ignore-all lint/suspicious/noExplicitAny: Coverage data structure is dynamic and comes from external tools */
// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: Complex analysis logic is intentional for comprehensive coverage reporting
/* eslint-disable no-non-english/no-non-english-characters */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import OpenAI from 'openai'

export class TestStrategyAnalyzer {
  private client: OpenAI

  constructor() {
    const apiKey = process.env['OPENAI_API_KEY']
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.client = new OpenAI({ apiKey })
  }

  async generateDetailedReport(
    coverageData: any,
    projectSpec?: string,
  ): Promise<string> {
    const prompt = this.createDetailedAnalysisPrompt(coverageData, projectSpec)

    const response = await this.client.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `あなたはt-wadaです。

以下の特徴を持つ詳細なテスト分析レポートを作成してください：

1. **実用性重視**: 開発者が実際に行動できる具体的な提案
2. **優先度明確**: High/Medium/Lowで明確な優先順位
3. **技術的正確性**: TypeScript/React/Vitestの知識を活用
4. **日本語**: 分かりやすい日本語で記述
5. **プロジェクト文脈**: projectSpecの情報を最大限活用

特に以下の点に注意してください：
- 具体的なファイルパスを含める
- 実装可能なコード例を提供
- テストピラミッドの現状と理想を比較
- ROI（投資対効果）を考慮した提案
- Liam ERD・Liam DBサービスの特性を考慮したテスト戦略
- パッケージ責任範囲に基づく具体的な提案`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    })

    return response.choices[0]?.message?.content || 'No analysis generated'
  }

  private createDetailedAnalysisPrompt(
    coverageData: any,
    projectSpec?: string,
  ): string {
    const summary = this.summarizeCoverageData(coverageData)
    const projectContext = projectSpec

    return `
# Frontend テストバランス分析依頼

## 仕様書

${projectContext}

## プロジェクト概要
- **プロジェクト**: Frontend TypeScript/React monorepo
- **主要技術**: React, Next.js, TypeScript, Vitest, Playwright
- **分析対象**: /frontend ディレクトリ配下
- **総ファイル数**: ${summary.totalFiles}

## カバレッジ分析結果
- **総合カバレッジ**: ${summary.overallCoverage.toFixed(2)}%
- **ステートメントカバレッジ**: ${summary.statementCoverage.toFixed(2)}%
- **ブランチカバレッジ**: ${summary.branchCoverage.toFixed(2)}%
- **関数カバレッジ**: ${summary.functionCoverage.toFixed(2)}%

## カバレッジ問題領域
### 未カバーファイル (${summary.uncoveredFiles.length}件)
${summary.uncoveredFiles
  .slice(0, 20)
  .map((file) => `- ${file}`)
  .join('\n')}

### 低カバレッジファイル (50%未満、${summary.lowCoverageFiles.length}件)
${summary.lowCoverageFiles
  .slice(0, 20)
  .map((file) => `- ${file.file}: ${file.coverage.toFixed(1)}%`)
  .join('\n')}

## パッケージ別カバレッジ分析
${Object.entries(summary.packageBreakdown)
  .map(
    ([pkg, data]: [string, any]) =>
      `- **${pkg}**: ${data.files}ファイル, 平均${data.coverage.toFixed(1)}%カバレッジ
  - ステートメント: ${data.statements.covered}/${data.statements.total} (${data.statements.total > 0 ? ((data.statements.covered / data.statements.total) * 100).toFixed(1) : 0}%)
  - ブランチ: ${data.branches.covered}/${data.branches.total} (${data.branches.total > 0 ? ((data.branches.covered / data.branches.total) * 100).toFixed(1) : 0}%)
  - 関数: ${data.functions.covered}/${data.functions.total} (${data.functions.total > 0 ? ((data.functions.covered / data.functions.total) * 100).toFixed(1) : 0}%)`,
  )
  .join('\n\n')}

## 詳細カバレッジ統計
- **総ステートメント**: ${summary.coveredStatements}/${summary.totalStatements} (${summary.statementCoverage.toFixed(2)}%)
- **総ブランチ**: ${summary.coveredBranches}/${summary.totalBranches} (${summary.branchCoverage.toFixed(2)}%)
- **総関数**: ${summary.coveredFunctions}/${summary.totalFunctions} (${summary.functionCoverage.toFixed(2)}%)

## テストファイル推測分析
${this.analyzeTestFilesFromCoverage(coverageData)}

---


## 出力要件

### テストピラミッド現状と理想比較

[ユニットテスト、インテグレーションテスト、E2Eテストの現在のバランスと理想状態を比較した結果を記載]

\`\`\`text
現状:

E2E (5%)
────────────
Integration (15%)
──────────────────
Unit Tests (80%)
\`\`\`

\`\`\`text
理想:

E2E (5%)
────────────
Integration (15%)
──────────────────
Unit Tests (80%)
\`\`\`

---

### 📊 カバレッジレポート

- **現在のカバレッジ状況**: 対象ファイルの現在のカバレッジ率
- **目標カバレッジ**: 実装後に達成すべきカバレッジ率

#### パッケージ別カバレッジ分析

- [各パッケージの現在と目標カバレッジ]
- [現在のカバレッジ率やSPECなどから判断される優先度整理と提案]

---

### 優先度別テスト実装提案

[優先度（High, Middle, Low）ごとに各実装提案について、以下の形式で出力]

---

#### 優先度 XXX

**1. [ファイル名] - [理由]**

[対象ファイルの中身を記載]
\`\`\`typescript

\`\`\`

🤖 **AI実装依頼プロンプト**:
\`\`\`text
[ここに即座にコピー可能な完全なプロンプトを記載]

以下のファイルのユニットテストを実装してください：

**対象ファイル**: \`path/to/target/file.ts\`
**技術スタック**: TypeScript + Vitest + Testing Library

**要件**:
- [具体的な要件1]
- [具体的な要件2]
- カバレッジ80%以上を目標

**実装してほしいテストケース**:
[t-wadaが推奨する観点・ボリューム感でテストケースを列挙]

**期待する出力**:
- テストファイル: \`path/to/target/file.test.ts\`
- 実行可能なテストコード

**参考情報**:
- [技術的な背景情報]
- [関連する型定義やインターフェース]
\`\`\`

`
  }

  private summarizeCoverageData(coverageData: any) {
    const files = Object.keys(coverageData)
    let totalStatements = 0
    let coveredStatements = 0
    let totalBranches = 0
    let coveredBranches = 0
    let totalFunctions = 0
    let coveredFunctions = 0

    const uncoveredFiles: string[] = []
    const lowCoverageFiles: Array<{
      file: string
      coverage: number
      statements: { total: number; covered: number }
      branches: { total: number; covered: number }
      functions: { total: number; covered: number }
    }> = []
    const packageBreakdown: Record<
      string,
      {
        files: number
        coverage: number
        statements: { total: number; covered: number }
        branches: { total: number; covered: number }
        functions: { total: number; covered: number }
      }
    > = {}

    for (const [filePath, fileData] of Object.entries(coverageData)) {
      const data = fileData as any
      let fileStatements = 0
      let fileCoveredStatements = 0
      let fileBranches = 0
      let fileCoveredBranches = 0
      let fileFunctions = 0
      let fileCoveredFunctions = 0

      if (data.s) {
        const statements = Object.values(data.s) as number[]
        fileStatements = statements.length
        fileCoveredStatements = statements.filter((count) => count > 0).length
        totalStatements += fileStatements
        coveredStatements += fileCoveredStatements

        const fileCoverage =
          fileStatements > 0
            ? (fileCoveredStatements / fileStatements) * 100
            : 0

        if (fileCoverage === 0) {
          uncoveredFiles.push(filePath)
        } else if (fileCoverage < 50) {
          // 詳細なカバレッジ情報を収集
          if (data.b) {
            const branches = Object.values(data.b) as number[][]
            fileBranches = branches.length
            fileCoveredBranches = branches.filter((branch) =>
              branch.some((count) => count > 0),
            ).length
          }

          if (data.f) {
            const functions = Object.values(data.f) as number[]
            fileFunctions = functions.length
            fileCoveredFunctions = functions.filter((count) => count > 0).length
          }

          lowCoverageFiles.push({
            file: filePath,
            coverage: fileCoverage,
            statements: {
              total: fileStatements,
              covered: fileCoveredStatements,
            },
            branches: { total: fileBranches, covered: fileCoveredBranches },
            functions: { total: fileFunctions, covered: fileCoveredFunctions },
          })
        }
      }

      if (data.b) {
        const branches = Object.values(data.b) as number[][]
        fileBranches = branches.length
        fileCoveredBranches = branches.filter((branch) =>
          branch.some((count) => count > 0),
        ).length
        totalBranches += fileBranches
        coveredBranches += fileCoveredBranches
      }

      if (data.f) {
        const functions = Object.values(data.f) as number[]
        fileFunctions = functions.length
        fileCoveredFunctions = functions.filter((count) => count > 0).length
        totalFunctions += fileFunctions
        coveredFunctions += fileCoveredFunctions
      }

      const packageName = this.extractPackageName(filePath)
      if (!packageBreakdown[packageName]) {
        packageBreakdown[packageName] = {
          files: 0,
          coverage: 0,
          statements: { total: 0, covered: 0 },
          branches: { total: 0, covered: 0 },
          functions: { total: 0, covered: 0 },
        }
      }
      packageBreakdown[packageName].files++
      packageBreakdown[packageName].statements.total += fileStatements
      packageBreakdown[packageName].statements.covered += fileCoveredStatements
      packageBreakdown[packageName].branches.total += fileBranches
      packageBreakdown[packageName].branches.covered += fileCoveredBranches
      packageBreakdown[packageName].functions.total += fileFunctions
      packageBreakdown[packageName].functions.covered += fileCoveredFunctions
    }

    // パッケージ別カバレッジ率を計算
    for (const pkg of Object.keys(packageBreakdown)) {
      const pkgData = packageBreakdown[pkg]
      if (pkgData) {
        pkgData.coverage =
          pkgData.statements.total > 0
            ? (pkgData.statements.covered / pkgData.statements.total) * 100
            : 0
      }
    }

    return {
      totalFiles: files.length,
      overallCoverage:
        totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      statementCoverage:
        totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      branchCoverage:
        totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      functionCoverage:
        totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
      uncoveredFiles,
      lowCoverageFiles: lowCoverageFiles.sort(
        (a, b) => a.coverage - b.coverage,
      ),
      packageBreakdown,
      totalStatements,
      coveredStatements,
      totalBranches,
      coveredBranches,
      totalFunctions,
      coveredFunctions,
    }
  }

  private analyzeTestFilesFromCoverage(coverageData: any): string {
    const testFiles = Object.keys(coverageData).filter(
      (file) =>
        file.includes('.test.') ||
        file.includes('.spec.') ||
        file.includes('__tests__'),
    )

    const nonTestFiles = Object.keys(coverageData).filter(
      (file) =>
        !file.includes('.test.') &&
        !file.includes('.spec.') &&
        !file.includes('__tests__'),
    )

    return `
### カバレッジデータから推測されるテスト状況
- **テストファイル**: ${testFiles.length}件
- **プロダクションファイル**: ${nonTestFiles.length}件
- **テストファイル比率**: ${((testFiles.length / Object.keys(coverageData).length) * 100).toFixed(1)}%

### 既存テストファイル（推測）
${testFiles
  .slice(0, 10)
  .map((file) => `- ${file}`)
  .join('\n')}

### テスト未実装の重要ファイル（推測）
${nonTestFiles
  .filter((file) => {
    const data = coverageData[file] as any
    if (!data.s) return false
    const statements = Object.values(data.s) as number[]
    const covered = statements.filter((count) => count > 0).length
    return statements.length > 0 && covered / statements.length < 0.5
  })
  .slice(0, 15)
  .map((file) => `- ${file}`)
  .join('\n')}
`
  }

  private extractPackageName(filePath: string): string {
    const match = filePath.match(
      /frontend\/(apps|packages|internal-packages)\/([^\/]+)/,
    )
    return match ? `${match[1]}/${match[2]}` : 'unknown'
  }
}
