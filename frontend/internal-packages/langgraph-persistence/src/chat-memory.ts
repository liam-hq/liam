import { StateGraph, Annotation, MemorySaver } from "@langchain/langgraph";

// AIアシスタントの会話状態
const AssistantState = Annotation.Root({
  // ユーザー情報
  userName: Annotation<string>,
  userPreferences: Annotation<Record<string, string>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  
  // 会話コンテキスト
  currentTopic: Annotation<string>,
  messageHistory: Annotation<Array<{ role: string; content: string }>>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  
  // メタ情報
  sessionCount: Annotation<number>,
  lastActiveTime: Annotation<string>,
});

// AIアシスタントノード
const assistantNode = (state: typeof AssistantState.State) => {
  const now = new Date().toISOString();
  const sessionNum = state.sessionCount + 1;
  
  // 初回セッション
  if (sessionNum === 1) {
    console.log("🤖 新規ユーザーとの会話を開始");
    return {
      userName: "ゲスト",
      currentTopic: "自己紹介",
      sessionCount: sessionNum,
      lastActiveTime: now,
      messageHistory: [
        { role: "assistant", content: "はじめまして！私はAIアシスタントです。" },
        { role: "assistant", content: "お名前を教えていただけますか？" },
      ],
    };
  }
  
  // 2回目以降のセッション
  const timeSinceLastChat = new Date(now).getTime() - new Date(state.lastActiveTime).getTime();
  const minutesPassed = Math.floor(timeSinceLastChat / 1000 / 60);
  
  if (minutesPassed > 60) {
    console.log("🤖 久しぶりの会話を検知");
    return {
      sessionCount: sessionNum,
      lastActiveTime: now,
      currentTopic: "再会",
      messageHistory: [
        { role: "assistant", content: `お久しぶりです、${state.userName}さん！` },
        { role: "assistant", content: `前回は「${state.currentTopic}」について話していましたね。` },
      ],
    };
  } else {
    console.log("🤖 会話を継続");
    return {
      sessionCount: sessionNum,
      lastActiveTime: now,
      messageHistory: [
        { role: "assistant", content: `${state.userName}さん、続けましょう。` },
        { role: "assistant", content: `セッション${sessionNum}回目ですね。` },
      ],
    };
  }
};

// ユーザー入力を処理するノード
const processUserInput = (state: typeof AssistantState.State) => {
  // シミュレーション：ユーザーが名前を教える
  if (state.userName === "ゲスト" && state.sessionCount === 2) {
    console.log("👤 ユーザー: 私は花子です");
    return {
      userName: "花子",
      userPreferences: { language: "日本語", style: "カジュアル" },
      messageHistory: [
        { role: "user", content: "私は花子です" },
        { role: "assistant", content: "花子さん、よろしくお願いします！" },
      ],
    };
  }
  
  // シミュレーション：話題を変える
  if (state.sessionCount === 3) {
    console.log("👤 ユーザー: 天気について教えて");
    return {
      currentTopic: "天気",
      messageHistory: [
        { role: "user", content: "天気について教えて" },
        { role: "assistant", content: "天気の話題に変更しました。" },
      ],
    };
  }
  
  return {
    messageHistory: [
      { role: "user", content: "続けて" },
    ],
  };
};

async function main() {
  console.log("=== 🧠 AIアシスタントの永続的メモリ ===\n");
  
  // メモリセーバーを作成
  const checkpointer = new MemorySaver();
  
  // グラフを構築
  const graph = new StateGraph(AssistantState)
    .addNode("assistant", assistantNode)
    .addNode("processInput", processUserInput)
    .addEdge("__start__", "assistant")
    .addEdge("assistant", "processInput")
    .compile({ checkpointer });
  
  const threadId = "user-hanako-001";
  
  // セッション1: 初回の会話
  console.log("--- セッション1: 初めての会話 ---");
  const session1 = await graph.invoke(
    { sessionCount: 0 },
    { configurable: { thread_id: threadId } }
  );
  console.log("ユーザー名:", session1.userName);
  console.log("話題:", session1.currentTopic);
  console.log("メッセージ数:", session1.messageHistory.length);
  
  // セッション2: 名前を教える
  console.log("\n--- セッション2: 名前を教える（1分後） ---");
  await new Promise(resolve => setTimeout(resolve, 100)); // 短い待機
  const session2 = await graph.invoke(
    {},
    { configurable: { thread_id: threadId } }
  );
  console.log("ユーザー名:", session2.userName);
  console.log("好み:", session2.userPreferences);
  console.log("セッション数:", session2.sessionCount);
  
  // セッション3: 話題を変える
  console.log("\n--- セッション3: 話題を変える ---");
  const session3 = await graph.invoke(
    {},
    { configurable: { thread_id: threadId } }
  );
  console.log("現在の話題:", session3.currentTopic);
  console.log("総メッセージ数:", session3.messageHistory.length);
  
  // 別のユーザーのセッション
  console.log("\n--- 別のユーザー（新規） ---");
  const newUserSession = await graph.invoke(
    { sessionCount: 0 },
    { configurable: { thread_id: "user-taro-002" } }
  );
  console.log("ユーザー名:", newUserSession.userName);
  console.log("→ 完全に別の会話として扱われる");
  
  // 元のユーザーに戻る
  console.log("\n--- 花子さんに戻る（セッション4） ---");
  const session4 = await graph.invoke(
    {},
    { configurable: { thread_id: threadId } }
  );
  console.log("ユーザー名:", session4.userName, "← 覚えている！");
  console.log("最後の話題:", session4.currentTopic, "← 継続！");
  console.log("累計セッション:", session4.sessionCount);
  
  // 履歴の一部を表示
  console.log("\n--- 会話履歴（最後の5件） ---");
  session4.messageHistory.slice(-5).forEach(msg => {
    const icon = msg.role === "user" ? "👤" : "🤖";
    console.log(`${icon} ${msg.role}: ${msg.content}`);
  });
}

main().catch(console.error);