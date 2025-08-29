import { StateGraph, Annotation, MemorySaver } from "@langchain/langgraph";

// チャットの状態定義
const ChatState = Annotation.Root({
  userName: Annotation<string>,
  favoriteColor: Annotation<string>,
  messageCount: Annotation<number>,
  conversationHistory: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

// ユーザー情報を記憶するノード
const chatNode = (state: typeof ChatState.State) => {
  const count = state.messageCount + 1;
  
  // 初回の会話
  if (count === 1) {
    return {
      userName: "太郎",
      favoriteColor: "青",
      messageCount: count,
      conversationHistory: ["初めまして！太郎さん。好きな色は青ですね。"],
    };
  }
  
  // 2回目以降は前回の情報を使って返答
  return {
    messageCount: count,
    conversationHistory: [
      `こんにちは、${state.userName}さん！`,
      `前回${state.favoriteColor}が好きだと言ってましたね。`,
      `これで${count}回目の会話です。`,
    ],
  };
};

async function main() {
  // チェックポインターを作成（メモリに保存）
  const checkpointer = new MemorySaver();
  
  // グラフを構築（チェックポインター付き）
  const graph = new StateGraph(ChatState)
    .addNode("chat", chatNode)
    .addEdge("__start__", "chat")
    .compile({ checkpointer });  // ← ここが重要！
  
  console.log("=== 永続化デモ ===\n");
  
  // 1回目の会話（thread_id: "user-001"）
  console.log("--- 1回目の会話 (thread_id: user-001) ---");
  const result1 = await graph.invoke(
    { messageCount: 0 },
    { configurable: { thread_id: "user-001" } }
  );
  console.log("履歴:", result1.conversationHistory);
  console.log("記憶した名前:", result1.userName);
  console.log("記憶した色:", result1.favoriteColor);
  
  // 2回目の会話（同じthread_id）
  console.log("\n--- 2回目の会話 (同じthread_id: user-001) ---");
  const result2 = await graph.invoke(
    {},  // 空でOK、前回の状態から続く
    { configurable: { thread_id: "user-001" } }
  );
  console.log("履歴:", result2.conversationHistory);
  console.log("覚えていた名前:", result2.userName);
  console.log("覚えていた色:", result2.favoriteColor);
  console.log("会話回数:", result2.messageCount);
  
  // 3回目の会話（同じthread_id）
  console.log("\n--- 3回目の会話 (同じthread_id: user-001) ---");
  const result3 = await graph.invoke(
    {},
    { configurable: { thread_id: "user-001" } }
  );
  console.log("履歴:", result3.conversationHistory);
  console.log("会話回数:", result3.messageCount);
  
  // 別のユーザーの1回目の会話（違うthread_id）
  console.log("\n--- 別のユーザー (thread_id: user-002) ---");
  const result4 = await graph.invoke(
    { messageCount: 0 },
    { configurable: { thread_id: "user-002" } }
  );
  console.log("履歴:", result4.conversationHistory);
  console.log("会話回数:", result4.messageCount);
  console.log("→ 新しい会話として扱われる！");
  
  // 元のユーザーに戻る
  console.log("\n--- 元のユーザーに戻る (thread_id: user-001) ---");
  const result5 = await graph.invoke(
    {},
    { configurable: { thread_id: "user-001" } }
  );
  console.log("会話回数:", result5.messageCount, "← 続きから！");
  console.log("名前:", result5.userName, "← まだ覚えてる！");
}

main().catch(console.error);