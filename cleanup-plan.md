# コミット 7e824102e クリーンアップ計画

## 概要
コミット `7e824102e77f16d4da2fcc33645293c14ed2f7ec` "Implement execute-deep-modeling:memory" から、実験的な `execute-deep-modeling:memory` 機能を削除し、`@liam-hq/schema-bench executeLiamDB` に必要な変更のみを保持する。

## 変更ファイル分析

### 📁 frontend/internal-packages/agent/package.json
**削除対象:**
```json
"execute-deep-modeling:memory": "AGENT_MODE=memory tsx scripts/executeDeepModelingProcess.ts",
"execute-deep-modeling:memory:debug": "AGENT_MODE=memory tsx scripts/executeDeepModelingProcess.ts --log-level=DEBUG",
```

**保持:** その他の変更なし

### 📁 frontend/internal-packages/agent/scripts/executeDeepModelingProcess.ts
**削除対象:**
- `// @ts-nocheck` コメント
- `createInMemoryWorkflowState`, `setupInMemoryRepository` import
- `DebugCallbackHandler` import
- `useInMemory` 変数とAGENT_MODE判定ロジック
- InMemory用の条件分岐処理
- InMemoryRepository用の特別処理

**保持:** 
- 基本的なエラーハンドリング改善
- コード整理部分

### 📁 frontend/internal-packages/agent/scripts/shared/scriptUtils.ts
**削除対象:**
```typescript
// InMemoryRepository import
import { InMemoryRepository } from '../../src/repositories/InMemoryRepository'

// setupInMemoryRepository 関数全体
export const setupInMemoryRepository = (_logger: NodeLogger) => { ... }

// createInMemoryWorkflowState 関数全体  
export const createInMemoryWorkflowState = (setupResult: any) => { ... }
```

**保持:**
- `log` メソッド追加
- 詳細なスキーマ出力ログ機能（logSchemaResults拡張）
- その他のユーティリティ改善

### 📁 frontend/internal-packages/agent/src/repositories/InMemoryRepository.ts
**保持:**
- `buildingSchemas` Map追加とその関連処理
- InMemoryRepository機能拡張（schema-benchで使用）

### 📁 frontend/internal-packages/agent/src/utils/debugCallbackHandler.ts
**保持:**
- 新規ファイル全体（schema-benchで使用）

### 📁 frontend/internal-packages/agent/src/deepModeling.ts
**保持:**
- コードクリーンアップ
- 未使用変数コメントアウト
- エラーハンドリング改善

### 📁 その他のファイル
**保持:**
- `src/db-agent/tools/schemaDesignTool.ts` - 軽微な改善
- `src/langchain/agents/databaseSchemaBuildAgent/prompts.ts` - プロンプト改善

## schema-bench での使用確認

以下のファイルで必要な機能が使用されている：
- `frontend/internal-packages/schema-bench/src/executors/liamDb/liamDbExecutor.ts`
  - `InMemoryRepository` - 保持対象
  - `DebugCallbackHandler` - 保持対象

## 実行手順

1. **package.json** から memory スクリプトを削除
2. **executeDeepModelingProcess.ts** から AGENT_MODE 関連コードを削除  
3. **scriptUtils.ts** から InMemory専用関数を削除
4. 変更をテストして動作確認
5. コミットをamendして更新

## 期待される結果

- ✅ `@liam-hq/schema-bench executeLiamDB` は引き続き動作
- ✅ 不要な `execute-deep-modeling:memory` 機能は削除
- ✅ 有用な改善（ログ機能、デバッグ機能）は保持
- ✅ コードベースがクリーンな状態を維持

## 注意事項

- InMemoryRepository の buildingSchemas 拡張は schema-bench で必要なため削除しない
- DebugCallbackHandler は新規作成したファイルで schema-bench で使用するため削除しない
- logSchemaResults の詳細出力機能は有用なため保持する