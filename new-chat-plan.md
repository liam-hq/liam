# 実装計画: スキーマページへのチャット機能統合

schema-poc ページで実装されている機能を schema ページに統合するための計画を作成しました。主な変更点は以下の通りです：

1. チャットパネルを左側に配置
2. チャットの結果に基づいてER図を編集できるようにする

## 現状分析

**schema-poc ページ**:
- 左側にチャットパネル、右側にER図エディタを配置するグリッドレイアウト
- `SchemaChat` コンポーネントを直接使用
- スキーマの状態管理を実装し、チャットからスキーマを更新可能

**現在の schema ページ**:
- タブベースのレイアウト（ERDとエディタのタブ）
- チャットは `ChatbotButton` として実装され、クリックするとダイアログが開く
- チャットからスキーマを直接更新する機能はない

## 実装手順

### 1. SchemaPage コンポーネントの修正

`frontend/apps/app/features/schemas/pages/SchemaPage/SchemaPage.tsx` を修正して:

- タブベースのレイアウトからグリッドレイアウトに変更
- `SchemaChat` コンポーネントを左側に配置
- `ERDEditor` を右側に配置
- スキーマの状態管理を追加（サーバーコンポーネントからクライアントコンポーネントに変更）

### 2. CSS の更新

`SchemaPage.module.css` を更新して:
- グリッドレイアウトを実装（schema-poc の CSS を参考に）
- レスポンシブデザインの対応

### 3. スキーマ更新ロジックの実装

- `useState` を使用してスキーマの状態を管理
- `handleModifySchema` 関数を実装してチャットからのスキーマ更新を処理
- サーバーサイドのデータフェッチを維持しつつ、クライアントサイドでの状態更新を可能に

### 4. ChatbotButton の置き換え

- `ChatbotButton` を削除し、代わりに `SchemaChat` コンポーネントを使用
- 必要なプロパティを渡す

## 技術的な考慮事項

1. **サーバーコンポーネントからクライアントコンポーネントへの変更**:
   - 現在の `SchemaPage` はサーバーコンポーネント（async）
   - 状態管理のために 'use client' ディレクティブを追加し、クライアントコンポーネントに変更する必要がある
   - データフェッチは別の関数に分離し、useEffect で呼び出す

2. **スキーマデータの処理**:
   - サーバーから取得したスキーマデータを初期状態として使用
   - チャットによる更新はクライアント側で処理
   - 必要に応じてサーバーへの保存機能を実装

3. **レスポンシブデザイン**:
   - モバイル表示時はレイアウトを縦方向に変更（schema-poc と同様）

## コード実装の概要

```tsx
'use client'

// 必要なインポート

export const SchemaPage: FC<Props> = ({ projectId, branchOrCommit, schemaFilePath }) => {
  // 初期データ取得用のステート
  const [contentProps, setContentProps] = useState<Response | null>(null);
  // スキーマの状態管理
  const [schema, setSchema] = useState<Schema | null>(null);
  
  // データフェッチ
  useEffect(() => {
    async function fetchData() {
      const data = await getERDEditorContent({ projectId, branchOrCommit, schemaFilePath });
      setContentProps(data);
      setSchema(data.schema);
    }
    fetchData();
  }, [projectId, branchOrCommit, schemaFilePath]);

  // スキーマ更新ハンドラ
  const handleModifySchema = (newSchema: Schema) => {
    setSchema(JSON.parse(JSON.stringify(newSchema)) as Schema);
  };

  if (!contentProps || !schema) return <LoadingIndicator />;

  return (
    <div className={styles.container}>
      <div className={styles.chatPanel}>
        <SchemaChat schema={schema} onSchemaChange={handleModifySchema} />
      </div>
      <div className={styles.editorPanel}>
        <SchemaHeader />
        <ERDEditor 
          {...contentProps}
          schema={schema} // 更新されたスキーマを使用
        />
      </div>
    </div>
  );
};
```

この計画を実装することで、schema-poc ページの機能を schema ページに統合し、チャットパネルを左側に配置してER図の編集を可能にすることができます。
