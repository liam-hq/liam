import { StateGraph, Command, Annotation } from "@langchain/langgraph";

// コーヒーショップの注文処理システム
const OrderState = Annotation.Root({
  customerName: Annotation<string>,
  drink: Annotation<string>,
  size: Annotation<string>,
  temperature: Annotation<string>,
  customization: Annotation<string>,
  price: Annotation<number>,
  loyaltyPoints: Annotation<number>,
  orderStatus: Annotation<string>,
  brewAttempts: Annotation<number>,
});

// 注文を受け付けて、飲み物のカテゴリーに応じて処理を分岐
const takeOrder = (state: typeof OrderState.State) => {
  console.log(`\n☕ いらっしゃいませ、${state.customerName}様！`);
  console.log(`📝 ご注文: ${state.size}サイズの${state.temperature}${state.drink}`);
  
  // 飲み物の種類に応じて次のステップを決定
  if (state.drink.includes("エスプレッソ") || state.drink.includes("ラテ")) {
    return new Command({
      update: {
        orderStatus: "エスプレッソマシンで抽出中",
        price: state.size === "Venti" ? 650 : 550,
      },
      goto: "brewEspresso"
    });
  } else if (state.drink.includes("フラペチーノ")) {
    return new Command({
      update: {
        orderStatus: "ブレンダーで調理中",
        price: state.size === "Venti" ? 750 : 650,
      },
      goto: "blendFrappuccino"
    });
  } else {
    return new Command({
      update: {
        orderStatus: "ドリップコーヒーを用意中",
        price: state.size === "Venti" ? 450 : 350,
      },
      goto: "pourDrip"
    });
  }
};

// エスプレッソマシンで抽出
const brewEspresso = (state: typeof OrderState.State) => {
  console.log("☕ エスプレッソを抽出しています...");
  console.log("♨️  シューッ... 良い香りが広がります");
  return {
    customization: state.customization + " + 完璧なクレマ",
    orderStatus: "エスプレッソ抽出完了",
  };
};

// フラペチーノをブレンド
const blendFrappuccino = (state: typeof OrderState.State) => {
  console.log("🧊 氷とミルクをブレンダーに投入...");
  console.log("🌪️  ガガガガガ... ブレンド中");
  return {
    customization: state.customization + " + ホイップクリーム",
    orderStatus: "ブレンド完了",
  };
};

// ドリップコーヒーを注ぐ
const pourDrip = (state: typeof OrderState.State) => {
  console.log("☕ 本日のコーヒーを注いでいます...");
  return {
    orderStatus: "ドリップコーヒー準備完了",
  };
};

// ポイントカードをチェックして特典を付与
const checkLoyaltyCard = (state: typeof OrderState.State) => {
  console.log(`\n💳 ポイントカード確認中... 現在${state.loyaltyPoints}ポイント`);
  
  if (state.loyaltyPoints >= 100) {
    return new Command({
      update: {
        loyaltyPoints: state.loyaltyPoints - 100 + 10,
        price: 0,
        orderStatus: "無料ドリンク特典適用！",
      },
      goto: "celebrateFreeDrink"
    });
  } else if (state.loyaltyPoints >= 50) {
    return new Command({
      update: {
        loyaltyPoints: state.loyaltyPoints + 10,
        price: state.price * 0.8,
        orderStatus: "20%割引適用",
      },
      goto: "applyDiscount"
    });
  } else {
    return new Command({
      update: {
        loyaltyPoints: state.loyaltyPoints + 10,
        orderStatus: "通常価格",
      },
      goto: "processPayment"
    });
  }
};

// 無料ドリンクのお祝い
const celebrateFreeDrink = (state: typeof OrderState.State) => {
  console.log("🎉 おめでとうございます！本日のドリンクは無料です！");
  console.log("✨ 日頃のご愛顧ありがとうございます");
  return { orderStatus: "お会計完了（無料特典）" };
};

// 割引を適用
const applyDiscount = (state: typeof OrderState.State) => {
  console.log(`💰 ゴールド会員割引適用: ¥${Math.round(state.price)}になります`);
  return { orderStatus: "お会計完了（割引適用）" };
};

// 通常のお会計
const processPayment = (state: typeof OrderState.State) => {
  console.log(`💴 お会計: ¥${state.price}になります`);
  return { orderStatus: "お会計完了" };
};

// ミルクをスチーム（失敗することもある）
const steamMilk = (state: typeof OrderState.State) => {
  console.log(`☕ ミルクスチーム試行 ${state.brewAttempts + 1}回目...`);
  
  // 3回目までは失敗する可能性がある
  if (state.brewAttempts < 2 && Math.random() < 0.5) {
    console.log("💥 おっと！ミルクが熱くなりすぎました...もう一度");
    return new Command({
      update: {
        brewAttempts: state.brewAttempts + 1,
        customization: state.customization + " [再スチーム中]",
      },
      goto: "steamMilk"  // 自分自身へ遷移してリトライ
    });
  }
  
  console.log("✨ 完璧なマイクロフォームができました！");
  return {
    customization: state.customization + " + 絹のようなスチームミルク",
    orderStatus: "ミルクスチーム完了",
    brewAttempts: state.brewAttempts + 1,
  };
};

// グラフ構築
const buildCoffeeOrderGraph = () => {
  const graph = new StateGraph(OrderState)
    .addNode("takeOrder", takeOrder, {
      ends: ["brewEspresso", "blendFrappuccino", "pourDrip"]
    })
    .addNode("brewEspresso", brewEspresso)
    .addNode("blendFrappuccino", blendFrappuccino)
    .addNode("pourDrip", pourDrip)
    .addEdge("__start__", "takeOrder")
    .addEdge("brewEspresso", "__end__")
    .addEdge("blendFrappuccino", "__end__")
    .addEdge("pourDrip", "__end__");
    
  return graph.compile();
};

const buildLoyaltyGraph = () => {
  const graph = new StateGraph(OrderState)
    .addNode("checkLoyalty", checkLoyaltyCard, {
      ends: ["celebrateFreeDrink", "applyDiscount", "processPayment"]
    })
    .addNode("celebrateFreeDrink", celebrateFreeDrink)
    .addNode("applyDiscount", applyDiscount)
    .addNode("processPayment", processPayment)
    .addEdge("__start__", "checkLoyalty");
    
  return graph.compile();
};

const buildMilkSteamGraph = () => {
  const graph = new StateGraph(OrderState)
    .addNode("steamMilk", steamMilk, {
      ends: ["steamMilk"]  // 自分自身へのループ
    })
    .addEdge("__start__", "steamMilk");
    
  return graph.compile();
};

// 実行例
async function main() {
  console.log("=== ☕ スターバックス風注文システム ===");
  
  console.log("\n--- エスプレッソドリンクの注文 ---");
  const coffeeGraph = buildCoffeeOrderGraph();
  const latteOrder = await coffeeGraph.invoke({
    customerName: "田中",
    drink: "カフェラテ",
    size: "Venti",
    temperature: "ホット",
    customization: "",
    price: 0,
    loyaltyPoints: 0,
    orderStatus: "",
    brewAttempts: 0,
  });
  console.log("📦 最終状態:", latteOrder);
  
  console.log("\n--- フラペチーノの注文 ---");
  const frapOrder = await coffeeGraph.invoke({
    customerName: "佐藤",
    drink: "キャラメルフラペチーノ",
    size: "Grande",
    temperature: "",
    customization: "エクストラキャラメル",
    price: 0,
    loyaltyPoints: 0,
    orderStatus: "",
    brewAttempts: 0,
  });
  console.log("📦 最終状態:", frapOrder);
  
  console.log("\n--- ポイントカード特典（無料ドリンク） ---");
  const loyaltyGraph = buildLoyaltyGraph();
  const vipCustomer = await loyaltyGraph.invoke({
    customerName: "山田VIP",
    drink: "カプチーノ",
    size: "Venti",
    temperature: "ホット",
    customization: "",
    price: 650,
    loyaltyPoints: 120,
    orderStatus: "",
    brewAttempts: 0,
  });
  console.log("📦 最終状態:", vipCustomer);
  
  console.log("\n--- ポイントカード特典（割引） ---");
  const goldCustomer = await loyaltyGraph.invoke({
    customerName: "鈴木",
    drink: "アメリカーノ",
    size: "Grande",
    temperature: "アイス",
    customization: "",
    price: 550,
    loyaltyPoints: 65,
    orderStatus: "",
    brewAttempts: 0,
  });
  console.log("📦 最終状態:", goldCustomer);
  
  console.log("\n--- ミルクスチーム（リトライ例） ---");
  const milkGraph = buildMilkSteamGraph();
  const milkResult = await milkGraph.invoke({
    customerName: "新人バリスタ",
    drink: "練習用ミルク",
    size: "",
    temperature: "",
    customization: "",
    price: 0,
    loyaltyPoints: 0,
    orderStatus: "",
    brewAttempts: 0,
  });
  console.log("📦 最終状態:", milkResult);
}

// 実行
main().catch(console.error);