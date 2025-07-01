// src/llm/openaiClient.ts
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

  async generateDetailedReport(coverageData: any): Promise<string> {
    const prompt = this.createDetailedAnalysisPrompt(coverageData)

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `あなたは経験豊富なシニアテストエンジニアです。

以下の特徴を持つ詳細なテスト分析レポートを作成してください：

1. **実用性重視**: 開発者が実際に行動できる具体的な提案
2. **優先度明確**: High/Medium/Lowで明確な優先順位
3. **技術的正確性**: TypeScript/React/Vitestの知識を活用
4. **視覚的**: ASCII図表やプログレスバーを使用
5. **日本語**: 分かりやすい日本語で記述

特に以下の点に注意してください：
- 具体的なファイルパスを含める
- 実装可能なコード例を提供
- テストピラミッドの現状と理想を比較
- ROI（投資対効果）を考慮した提案`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    })

    return response.choices[0]?.message?.content || 'No analysis generated'
  }

  private createDetailedAnalysisPrompt(coverageData: any): string {
    const summary = this.summarizeCoverageData(coverageData)

    return `
# Frontend テストバランス分析依頼

## プロジェクト概要
- **プロジェクト**: Frontend TypeScript/React monorepo
- **主要技術**: React, Next.js, TypeScript, Vitest, Playwright, Zustand
- **アーキテクチャ**: ERD可視化ツール（スキーマ解析・表示）
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
      `- **${pkg}**: ${data.files}ファイル, 平均${data.coverage.toFixed(1)}%カバレッジ`,
  )
  .join('\n')}

## テストファイル推測分析
${this.analyzeTestFilesFromCoverage(coverageData)}

---


## 出力要件

### 🎯 機能別テスト戦略提案の形式

各実装提案について、以下の形式で出力してください：

#### 🔥 優先度 High

**1. [ファイル名] - [理由]**

実装例:
\`\`\`typescript
// 例: convertSchemaToNodes のテスト
describe('convertSchemaToNodes', () => {
  it('should convert basic schema to nodes and edges', () => {
    const schema = { tables: { users: { columns: {...} } } }
    const result = convertSchemaToNodes({ schema, showMode: 'ALL_FIELDS' })
    expect(result.nodes).toHaveLength(1)
    expect(result.edges).toHaveLength(0)
  })
})
\`\`\`

🤖 **AI実装依頼プロンプト**:
\`\`\`
[ここに即座にコピー可能な完全なプロンプトを記載]

以下のファイルのユニットテストを実装してください：

**対象ファイル**: \`path/to/target/file.ts\`
**技術スタック**: TypeScript + Vitest + Testing Library

**要件**:
- [具体的な要件1]
- [具体的な要件2]
- カバレッジ80%以上を目標

**実装してほしいテストケース**:
1. [テストケース1の詳細]
2. [テストケース2の詳細]
3. [テストケース3の詳細]

**期待する出力**:
- テストファイル: \`path/to/target/file.test.ts\`
- 実行可能なテストコード
- モックが必要な場合は適切なモック実装

**参考情報**:
- [技術的な背景情報]
- [関連する型定義やインターフェース]
\`\`\`

---

**2. [次のファイル名] - [理由]**

実装例:
\`\`\`typescript
// 次の実装例
\`\`\`

🤖 **AI実装依頼プロンプト**:
\`\`\`
// 次のプロンプト
\`\`\`

---

この形式で、各優先度レベル（High/Medium/Low）について、実装例とAI依頼プロンプトをセットで提供してください。

**重要な要求事項**:
- 実装例は実際に動作するコードスニペット
- AI依頼プロンプトは完全に独立してコピー可能
- 具体的なファイルパスと技術要件を含める
- 各プロンプトは即座に他のAIアシスタントに依頼できる完成度

`
  }

  private summarizeCoverageData(coverageData: any) {
    // 前回実装したsummarizeCoverageDataメソッドと同じ
    const files = Object.keys(coverageData)
    let totalStatements = 0
    let coveredStatements = 0
    let totalBranches = 0
    let coveredBranches = 0
    let totalFunctions = 0
    let coveredFunctions = 0

    const uncoveredFiles: string[] = []
    const lowCoverageFiles: Array<{ file: string; coverage: number }> = []
    const packageBreakdown: Record<
      string,
      { files: number; coverage: number }
    > = {}

    for (const [filePath, fileData] of Object.entries(coverageData)) {
      const data = fileData as any

      if (data.s) {
        const statements = Object.values(data.s) as number[]
        totalStatements += statements.length
        const covered = statements.filter((count) => count > 0).length
        coveredStatements += covered

        const fileCoverage =
          statements.length > 0 ? (covered / statements.length) * 100 : 0

        if (fileCoverage === 0) {
          uncoveredFiles.push(filePath)
        } else if (fileCoverage < 50) {
          lowCoverageFiles.push({ file: filePath, coverage: fileCoverage })
        }
      }

      if (data.b) {
        const branches = Object.values(data.b) as number[][]
        totalBranches += branches.length
        coveredBranches += branches.filter((branch) =>
          branch.some((count) => count > 0),
        ).length
      }

      if (data.f) {
        const functions = Object.values(data.f) as number[]
        totalFunctions += functions.length
        coveredFunctions += functions.filter((count) => count > 0).length
      }

      const packageName = this.extractPackageName(filePath)
      if (!packageBreakdown[packageName]) {
        packageBreakdown[packageName] = { files: 0, coverage: 0 }
      }
      packageBreakdown[packageName].files++
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
