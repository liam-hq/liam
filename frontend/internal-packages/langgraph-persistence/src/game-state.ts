import { StateGraph, Annotation, MemorySaver, Command } from "@langchain/langgraph";

// RPGゲームの状態管理
const GameState = Annotation.Root({
  // プレイヤー情報
  playerName: Annotation<string>,
  level: Annotation<number>,
  hp: Annotation<number>,
  maxHp: Annotation<number>,
  exp: Annotation<number>,
  gold: Annotation<number>,
  
  // インベントリ
  inventory: Annotation<string[]>({
    reducer: (prev, next) => [...new Set([...prev, ...next])],
    default: () => [],
  }),
  
  // ゲーム進行
  currentLocation: Annotation<string>,
  questsCompleted: Annotation<string[]>({
    reducer: (prev, next) => [...new Set([...prev, ...next])],
    default: () => [],
  }),
  
  // 戦闘状態
  inBattle: Annotation<boolean>,
  enemyHp: Annotation<number>,
  battleLog: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

// 町での行動
const townNode = (state: typeof GameState.State) => {
  console.log(`\n🏘️ ${state.playerName}は町にいます`);
  console.log(`💰 所持金: ${state.gold}G | ❤️ HP: ${state.hp}/${state.maxHp}`);
  
  // HPを回復
  if (state.hp < state.maxHp) {
    console.log("🏥 宿屋でHPが全回復しました！");
    return new Command({
      update: {
        hp: state.maxHp,
        gold: Math.max(0, state.gold - 10),
        battleLog: ["宿屋で休憩した（-10G）"],
      },
      goto: "shop",
    });
  }
  
  // 冒険に出る
  return new Command({
    update: {
      currentLocation: "ダンジョン",
      battleLog: ["ダンジョンへ向かった"],
    },
    goto: "dungeon",
  });
};

// ショップ
const shopNode = (state: typeof GameState.State) => {
  console.log("\n🛍️ ショップを訪れた");
  
  if (state.gold >= 50 && !state.inventory.includes("ポーション")) {
    console.log("💊 ポーションを購入！");
    return {
      gold: state.gold - 50,
      inventory: ["ポーション"],
      battleLog: ["ポーションを購入した（-50G）"],
    };
  }
  
  return {
    battleLog: ["ショップを見て回った"],
  };
};

// ダンジョン探索
const dungeonNode = (state: typeof GameState.State) => {
  console.log("\n⚔️ ダンジョンでモンスターと遭遇！");
  
  return new Command({
    update: {
      inBattle: true,
      enemyHp: 30,
      battleLog: ["スライムが現れた！"],
    },
    goto: "battle",
  });
};

// 戦闘
const battleNode = (state: typeof GameState.State) => {
  console.log(`\n⚔️ 戦闘中！ プレイヤーHP: ${state.hp} | 敵HP: ${state.enemyHp}`);
  
  // プレイヤーの攻撃
  const playerDamage = 10 + state.level * 2;
  const newEnemyHp = Math.max(0, state.enemyHp - playerDamage);
  console.log(`🗡️ ${playerDamage}のダメージを与えた！`);
  
  // 敵を倒した
  if (newEnemyHp <= 0) {
    const expGain = 20;
    const goldGain = 30;
    const newExp = state.exp + expGain;
    const levelUp = newExp >= 100;
    
    console.log("🎉 勝利！");
    if (levelUp) console.log("📈 レベルアップ！");
    
    return new Command({
      update: {
        inBattle: false,
        enemyHp: 0,
        exp: levelUp ? newExp - 100 : newExp,
        level: levelUp ? state.level + 1 : state.level,
        maxHp: levelUp ? state.maxHp + 10 : state.maxHp,
        hp: levelUp ? state.maxHp + 10 : state.hp,
        gold: state.gold + goldGain,
        questsCompleted: ["スライム討伐"],
        battleLog: [
          `スライムを倒した！`,
          `${expGain}EXPと${goldGain}Gを獲得`,
          levelUp ? "レベルアップ！" : "",
        ].filter(Boolean),
      },
      goto: "victory",
    });
  }
  
  // 敵の攻撃
  const enemyDamage = 5;
  const newPlayerHp = Math.max(0, state.hp - enemyDamage);
  console.log(`💥 ${enemyDamage}のダメージを受けた！`);
  
  // プレイヤーが倒れた
  if (newPlayerHp <= 0) {
    return new Command({
      update: {
        hp: 0,
        inBattle: false,
        battleLog: ["倒れてしまった..."],
      },
      goto: "gameover",
    });
  }
  
  // 戦闘継続
  return new Command({
    update: {
      hp: newPlayerHp,
      enemyHp: newEnemyHp,
      battleLog: [
        `${playerDamage}ダメージを与えた`,
        `${enemyDamage}ダメージを受けた`,
      ],
    },
    goto: "battle", // 自分自身へループ
  });
};

// 勝利
const victoryNode = (state: typeof GameState.State) => {
  console.log("\n🏆 戦闘に勝利！町へ戻ります");
  return {
    currentLocation: "町",
    battleLog: ["町へ戻った"],
  };
};

// ゲームオーバー
const gameoverNode = (state: typeof GameState.State) => {
  console.log("\n💀 ゲームオーバー... 町で復活します");
  return {
    hp: Math.floor(state.maxHp / 2),
    gold: Math.floor(state.gold / 2),
    currentLocation: "町",
    inBattle: false,
    battleLog: ["町で復活した（所持金半減）"],
  };
};

// ゲームグラフの構築
const buildGameGraph = () => {
  return new StateGraph(GameState)
    .addNode("town", townNode, { ends: ["shop", "dungeon"] })
    .addNode("shop", shopNode)
    .addNode("dungeon", dungeonNode, { ends: ["battle"] })
    .addNode("battle", battleNode, { ends: ["battle", "victory", "gameover"] })
    .addNode("victory", victoryNode)
    .addNode("gameover", gameoverNode)
    .addEdge("__start__", "town")
    .addEdge("shop", "dungeon")
    .addEdge("victory", "town")
    .addEdge("gameover", "town");
};

async function main() {
  console.log("=== 🎮 RPGゲームの永続的セーブデータ ===");
  
  const checkpointer = new MemorySaver();
  const graph = buildGameGraph().compile({ 
    checkpointer,
    recursionLimit: 50  // 再帰上限を増やす
  });
  
  // プレイヤー1のセーブデータ
  const player1Save = "save-player1";
  
  // ゲーム開始（短いセッションで実行）
  console.log("\n--- 新規ゲーム開始（短縮版デモ） ---");
  const newGame = await graph.invoke(
    {
      playerName: "勇者アリス",
      level: 1,
      hp: 50,
      maxHp: 50,
      exp: 80,  // 経験値を多めに設定（レベルアップ間近）
      gold: 100,
      currentLocation: "町",
      inBattle: false,
      enemyHp: 0,
    },
    { 
      configurable: { thread_id: player1Save },
      recursionLimit: 15  // このinvokeだけ制限
    }
  );
  console.log("状態:", {
    レベル: newGame.level,
    HP: `${newGame.hp}/${newGame.maxHp}`,
    経験値: newGame.exp,
    所持金: `${newGame.gold}G`,
    場所: newGame.currentLocation,
  });
  
  // セーブして中断
  console.log("\n--- ゲームを中断（セーブ） ---");
  console.log("💾 セーブデータID:", player1Save);
  
  // 後で再開
  console.log("\n--- セーブデータから再開 ---");
  const loadedGame = await graph.invoke(
    {},
    { configurable: { thread_id: player1Save } }
  );
  console.log("ロードした状態:", {
    プレイヤー: loadedGame.playerName,
    レベル: loadedGame.level,
    場所: loadedGame.currentLocation,
    クエスト: loadedGame.questsCompleted,
  });
  
  // 別のプレイヤーのセーブデータ
  console.log("\n--- 別のプレイヤーの新規ゲーム ---");
  const player2Save = "save-player2";
  const player2Game = await graph.invoke(
    {
      playerName: "魔法使いボブ",
      level: 1,
      hp: 40,
      maxHp: 40,
      exp: 0,
      gold: 150,
      currentLocation: "町",
      inBattle: false,
      enemyHp: 0,
    },
    { configurable: { thread_id: player2Save } }
  );
  console.log("プレイヤー2:", {
    名前: player2Game.playerName,
    所持金: `${player2Game.gold}G`,
  });
  
  // プレイヤー1のセーブデータは影響を受けない
  console.log("\n--- プレイヤー1のデータを確認 ---");
  const checkPlayer1 = await graph.invoke(
    {},
    { configurable: { thread_id: player1Save } }
  );
  console.log("プレイヤー1のデータは保持されている:", {
    名前: checkPlayer1.playerName,
    レベル: checkPlayer1.level,
    所持金: `${checkPlayer1.gold}G`,
  });
  
  // 戦闘ログの確認
  if (checkPlayer1.battleLog.length > 0) {
    console.log("\n--- 戦闘ログ ---");
    checkPlayer1.battleLog.slice(-5).forEach(log => {
      console.log(`📜 ${log}`);
    });
  }
}

main().catch(console.error);