# ER Diagram Chat

このコンポーネントは、ERダイアグラムとチャット機能を統合したインターフェースを提供します。

## 機能

- ERダイアグラムの表示と編集
- エンティティに関連付けられたチャット機能
- スレッド形式のメッセージ
- バージョン管理機能

## 使用方法

### ページコンポーネントの作成

以下のコードを `frontend/apps/app/app/(app)/app/(with-project-and-branch)/projects/[projectId]/ref/[branchOrCommit]/build/page.tsx` に配置します：

```tsx
import { BuildPage } from '@/components/BuildPage'
import type { PageProps } from '@/app/types'
import * as v from 'valibot'
import { use } from 'react'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: v.string(),
})

export default function Page({ params }: PageProps) {
  // Unwrap params with React.use() as recommended by Next.js
  const unwrappedParams = use(params)
  
  const parsedParams = v.safeParse(paramsSchema, unwrappedParams)
  if (!parsedParams.success) throw new Error("Invalid route parameters")

  const { projectId, branchOrCommit } = parsedParams.output

  return <BuildPage projectId={projectId} branchOrCommit={branchOrCommit} />
}
```

### 依存関係

このコンポーネントは以下の依存関係を持ちます：

- `@liam-hq/erd-core`: ERダイアグラム機能
- `@liam-hq/ui`: UIコンポーネント
- `@xyflow/react`: フローチャート機能（インストールが必要）

## コンポーネント構造

```
frontend/apps/app/components/BuildPage/
├─ index.ts
├─ BuildPage.tsx
├─ BuildPage.module.css
├─ hooks/
│  ├─ useERDChat.ts
│  ├─ useNodeConnections.ts
│  ├─ useERDChatIntegration.ts
│  └─ useVersionManagement.ts
├─ components/
│  ├─ ChatInterface/
│  ├─ ThreadView/
│  ├─ ChatNode/
│  ├─ ChatInputNode/
│  └─ VersionControl/
```

## カスタムフック

### useERDChat

チャット機能の状態管理を行います。メッセージの送信、スレッドの作成、返信などの機能を提供します。

### useNodeConnections

ERDノード間の接続ロジックを実装します。エンティティノードとチャットノードの接続、位置計算などを行います。

### useERDChatIntegration

ERDデータとチャットデータの統合を行います。エンティティに関連付けられたメッセージの管理などを行います。

### useVersionManagement

ERDとチャットの状態のバージョン管理を行います。バージョンの作成、切り替え、履歴表示などの機能を提供します。

## 既知の問題

1. **依存関係の問題**
   - @xyflow/reactモジュールのインストールが必要です
   - 型定義の問題があります

2. **モックデータの使用**
   - 現在はモックデータを使用しています
   - 実際のAPIと統合する必要があります

## 今後の改善点

1. **パフォーマンス最適化**
   - 大規模ERDの表示パフォーマンスの最適化
   - チャットデータの遅延読み込みの実装
   - メモリ使用量の最適化

2. **テスト実装**
   - 単体テスト
   - 統合テスト
   - エンドツーエンドテスト
