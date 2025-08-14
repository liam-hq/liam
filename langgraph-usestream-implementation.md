# LangGraph useStream実装のための必要作業

## 概要
LangGraph JSの`useStream`フックを使用してストリーミング機能を実装するために必要だった作業をまとめます。

## 実装手順

### 1. 依存関係のインストール
```bash
pnpm add @langchain/langgraph-sdk
```

### 2. クライアントコンポーネントの作成
`useStream`フックを使用するReactコンポーネントを作成しました。

#### 重要なポイント：
- `apiUrl`が設定されるまでコンポーネントをレンダリングしない
- 空文字列ではなく、適切なAPIエンドポイントURLを渡す
- クライアントサイドでAPIのURLを動的に設定

```typescript
const StreamComponent: FC<{ apiUrl: string; designSessionId: string }> = ({ 
  apiUrl, 
  designSessionId 
}) => {
  const {
    messages,
    isLoading,
    error,
    submit,
    stop,
    interrupt,
    joinStream,
  } = useStream({
    apiUrl,
    assistantId: 'liam-agent',
    threadId: designSessionId,
    messagesKey: 'messages',
  })
  // ...
}
```

### 3. SSE（Server-Sent Events）APIエンドポイントの実装

#### 3.1 ストリーミングエンドポイント (`/api/stream/threads/[threadId]/runs/stream`)
- POSTメソッドでストリームを開始
- SSEフォーマットでレスポンスを返す
- 適切なヘッダーを設定：
  ```typescript
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  }
  ```

#### 3.2 履歴エンドポイント (`/api/stream/threads/[threadId]/history`)
- GET/POSTの両方をサポート
- 空の配列`[]`を返す（POC用）

### 4. SSEイベントフォーマットの修正

#### 正しいSSEフォーマット：
```
event: eventname
data: {"key": "value"}

```

#### 重要な修正点：
- バックスラッシュエスケープ（`\n`）ではなく、実際の改行を使用
- イベント名とデータは同じ行から始める
- 各イベントの後に空行（2つの改行）を追加

### 5. メッセージイベントの形式

LangGraph SDKが期待するメッセージイベント形式：
```typescript
event: messages
data: [message, metadata]
```

- イベント名は`messages`（`messages-tuple`ではない）
- データは配列形式で、最初の要素がメッセージ、2番目がメタデータ

### 6. メッセージオブジェクトの構造

LangGraphが期待するメッセージ形式：
```typescript
{
  id: string,
  type: 'human' | 'ai' | 'system' | 'tool' | 'function',
  content: string | MessageContentComplex[],
  // その他のオプショナルフィールド
}
```

### 7. localhost:8123へのフォールバック問題の解決

#### 問題：
- LangGraph SDKのClientクラスはデフォルトで`http://localhost:8123`を使用
- 空のapiUrlや未定義のapiUrlを渡すとデフォルトに戻る

#### 解決策：
- apiUrlが設定されるまでuseStreamを呼び出さない
- 条件付きレンダリングを使用：
```typescript
export const StreamPocClient: FC<Props> = ({ designSessionId }) => {
  const [apiUrl, setApiUrl] = useState<string>('')

  useEffect(() => {
    const protocol = window.location.protocol
    const host = window.location.host
    setApiUrl(`${protocol}//${host}/api/stream`)
  }, [])

  if (!apiUrl) {
    return <div>Loading...</div>
  }

  return <StreamComponent apiUrl={apiUrl} designSessionId={designSessionId} />
}
```

## 必要なAPIエンドポイント

LangGraph SDKが期待するエンドポイント構造：
- `POST /api/stream/threads/{threadId}/runs/stream` - ストリーミング実行
- `GET/POST /api/stream/threads/{threadId}/history` - スレッド履歴の取得

## トラブルシューティング

### よくある問題と解決策：

1. **メッセージが表示されない**
   - SSEイベント名が正しいか確認（`messages`を使用）
   - メッセージフォーマットが正しいか確認

2. **ポート8123エラー**
   - apiUrlが正しく設定されているか確認
   - 空文字列やundefinedを渡していないか確認

3. **SSEストリームが機能しない**
   - 正しいヘッダーが設定されているか確認
   - イベントフォーマットが正しいか確認（改行の位置に注意）

## まとめ

LangGraphのuseStreamを使用するには：
1. 正しいAPIエンドポイント構造の実装
2. 適切なSSEフォーマットでのレスポンス
3. クライアント側でのapiUrl設定の管理
4. LangGraphが期待するメッセージ形式の遵守

これらの要件を満たすことで、LangGraphのストリーミング機能を正常に動作させることができます。