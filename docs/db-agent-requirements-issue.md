# DB Agent Requirements Issue

## 問題の概要

DB Agentが単独で実行される場合、PM Agentの要件（analyzedRequirements）が正しく渡されておらず、QA Agentが「Unable to generate test scenarios」エラーで失敗する。

## 根本原因

1. **DB Agentのグラフ構造の問題**
   - 現在のDB Agent（`createDbAgentGraph`）はサブグラフとして設計されている
   - `designSchema` → `generateUsecase`ルートで`END`に到達し、メインフローの`generateUsecaseNode`が実行されない

2. **要件の受け渡しの問題**
   - PM Agentが作成したanalyzedRequirementsがartifactに保存されている
   - DB Agent実行時にartifactから要件を取得する処理が実装済みだが、QA Agentまで到達しない

## 解決策

### 1. スタンドアロンDB Agentグラフの作成（実装済み）
`createDbAgentStandaloneGraph.ts`を作成し、以下のノードを含む完全なグラフを実装：
- designSchema
- invokeSchemaDesignTool
- generateUsecase
- prepareDML
- validateSchema
- finalizeArtifacts

### 2. invokeDbAgentの修正が必要
```typescript
// 現在（問題あり）
const compiled = createDbAgentGraph()

// 修正後
const compiled = createDbAgentStandaloneGraph()
```

## デバッグ手順

1. **要件の取得確認**
   - `setupWorkflowState`でPM Agentのartifactから要件が正しく取得されているか確認
   - console.logまたはデバッガーで`analyzedRequirements`の内容を確認

2. **フローの確認**
   - 各ノードの実行順序を確認
   - `routeAfterDesignSchema`の判定が正しく動作しているか確認

3. **QA Agentの入力確認**
   - `generateUsecaseNode`が受け取る`state.analyzedRequirements`の内容を確認
   - スキーマベースのフォールバック処理が正しく動作しているか確認

## 今後の作業

1. スタンドアロンDB Agentグラフへの切り替え
2. エンドツーエンドテストの実装
3. ログ出力の改善（production用のロギング実装）