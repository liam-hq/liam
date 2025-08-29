import { StateGraph, Annotation, MemorySaver } from "@langchain/langgraph";

// シンプルなゲーム状態
const SimpleGameState = Annotation.Root({
  playerName: Annotation<string>,
  level: Annotation<number>,
  exp: Annotation<number>,
  gold: Annotation<number>,
  playCount: Annotation<number>,
  achievements: Annotation<string[]>({
    reducer: (prev, next) => [...new Set([...prev, ...next])],
    default: () => [],
  }),
});

// ゲームプレイ
const playGameNode = (state: typeof SimpleGameState.State) => {
  const newPlayCount = state.playCount + 1;
  console.log(`\n🎮 ${state.playerName}のプレイ ${newPlayCount}回目`);
  console.log(`📊 レベル: ${state.level} | 経験値: ${state.exp} | 所持金: ${state.gold}G`);
  
  // ゲームの結果をシミュレート
  const expGained = Math.floor(Math.random() * 50) + 10;
  const goldGained = Math.floor(Math.random() * 100) + 20;
  
  console.log(`⚔️  クエストクリア！`);
  console.log(`✨ 獲得: ${expGained}EXP, ${goldGained}G`);
  
  const newExp = state.exp + expGained;
  const levelUp = newExp >= 100;
  const newLevel = levelUp ? state.level + 1 : state.level;
  const newAchievements = [];
  
  if (levelUp) {
    console.log("🎉 レベルアップ！");
    newAchievements.push(`レベル${newLevel}到達`);
  }
  
  if (state.gold + goldGained >= 500 && !state.achievements.includes("富豪")) {
    newAchievements.push("富豪");
    console.log("🏆 実績解除: 富豪（500G以上）");
  }
  
  if (newPlayCount >= 5 && !state.achievements.includes("常連プレイヤー")) {
    newAchievements.push("常連プレイヤー");
    console.log("🏆 実績解除: 常連プレイヤー");
  }
  
  return {
    exp: levelUp ? newExp - 100 : newExp,
    level: newLevel,
    gold: state.gold + goldGained,
    playCount: newPlayCount,
    achievements: newAchievements,
  };
};

async function main() {
  console.log("=== 🎮 シンプルなセーブデータデモ ===");
  
  const checkpointer = new MemorySaver();
  const graph = new StateGraph(SimpleGameState)
    .addNode("play", playGameNode)
    .addEdge("__start__", "play")
    .compile({ checkpointer });
  
  const saveFile = "player-alice-save";
  
  // 初回プレイ
  console.log("\n--- 初回プレイ ---");
  const session1 = await graph.invoke(
    {
      playerName: "アリス",
      level: 1,
      exp: 0,
      gold: 100,
      playCount: 0,
    },
    { configurable: { thread_id: saveFile } }
  );
  console.log("セーブ完了:", {
    レベル: session1.level,
    経験値: session1.exp,
    所持金: `${session1.gold}G`,
  });
  
  // 2回目のプレイ（続きから）
  console.log("\n--- 2回目のプレイ（セーブデータから） ---");
  const session2 = await graph.invoke(
    {},  // 空でOK、前回の状態から続く
    { configurable: { thread_id: saveFile } }
  );
  console.log("現在の状態:", {
    レベル: session2.level,
    経験値: session2.exp,
    所持金: `${session2.gold}G`,
    プレイ回数: session2.playCount,
  });
  
  // 3回目のプレイ
  console.log("\n--- 3回目のプレイ ---");
  const session3 = await graph.invoke(
    {},
    { configurable: { thread_id: saveFile } }
  );
  
  // 4回目のプレイ
  console.log("\n--- 4回目のプレイ ---");
  const session4 = await graph.invoke(
    {},
    { configurable: { thread_id: saveFile } }
  );
  
  // 5回目のプレイ
  console.log("\n--- 5回目のプレイ ---");
  const session5 = await graph.invoke(
    {},
    { configurable: { thread_id: saveFile } }
  );
  
  // 最終状態の確認
  console.log("\n=== 最終セーブデータ ===");
  console.log({
    プレイヤー: session5.playerName,
    レベル: session5.level,
    経験値: session5.exp,
    所持金: `${session5.gold}G`,
    プレイ回数: session5.playCount,
    実績: session5.achievements,
  });
  
  // 別のプレイヤーのセーブデータ
  console.log("\n--- 別のプレイヤー（ボブ）の新規ゲーム ---");
  const bobSave = "player-bob-save";
  const bobSession = await graph.invoke(
    {
      playerName: "ボブ",
      level: 1,
      exp: 0,
      gold: 150,
      playCount: 0,
    },
    { configurable: { thread_id: bobSave } }
  );
  console.log("ボブの状態:", {
    レベル: bobSession.level,
    所持金: `${bobSession.gold}G`,
  });
  
  // アリスのセーブデータは影響を受けない
  console.log("\n--- アリスのセーブデータを再確認 ---");
  const aliceCheck = await graph.invoke(
    {},
    { configurable: { thread_id: saveFile } }
  );
  console.log("アリスのデータは保持されている:");
  console.log({
    プレイヤー: aliceCheck.playerName,
    レベル: aliceCheck.level,
    プレイ回数: aliceCheck.playCount,
    実績: aliceCheck.achievements,
  });
}

main().catch(console.error);