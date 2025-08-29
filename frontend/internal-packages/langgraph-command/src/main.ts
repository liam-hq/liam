import { StateGraph, Command, Annotation } from "@langchain/langgraph";
import { z } from "zod";

// 状態の定義
const StateAnnotation = Annotation.Root({
  foo: Annotation<string>,
  bar: Annotation<string>,
  score: Annotation<number>,
  result: Annotation<string>,
  processed: Annotation<boolean>,
  retryCount: Annotation<number>,
});

// 基本的なCommandの使用例
const myNode = (state: typeof StateAnnotation.State) => {
  console.log("myNode実行:", state);
  return new Command({
    // 状態の更新
    update: {
      foo: "updated by myNode",
      processed: true,
    },
    // 次のノードへの遷移
    goto: "myOtherNode",
  });
};

// 別のノード
const myOtherNode = (state: typeof StateAnnotation.State) => {
  console.log("myOtherNode実行:", state);
  return {
    bar: "updated by myOtherNode",
  };
};

// 条件に応じた動的ルーティングの例
const routerNode = (state: typeof StateAnnotation.State) => {
  console.log("routerNode実行: score =", state.score);
  
  if (state.score > 80) {
    return new Command({
      update: { 
        result: "優秀",
        processed: true 
      },
      goto: "celebrateNode"
    });
  } else if (state.score > 60) {
    return new Command({
      update: { 
        result: "合格",
        processed: true 
      },
      goto: "passNode"
    });
  } else {
    return new Command({
      update: { 
        result: "要改善",
        processed: true 
      },
      goto: "retryNode"
    });
  }
};

// 各結果ノード
const celebrateNode = (state: typeof StateAnnotation.State) => {
  console.log("🎉 優秀な成績です！");
  return { bar: "celebration complete" };
};

const passNode = (state: typeof StateAnnotation.State) => {
  console.log("✅ 合格です");
  return { bar: "pass complete" };
};

const retryNode = (state: typeof StateAnnotation.State) => {
  console.log("🔄 もう一度チャレンジしてください");
  return { bar: "retry suggested" };
};

// 再帰実行の例（自分自身へgoto）
const retryableNode = (state: typeof StateAnnotation.State) => {
  console.log(`retryableNode実行: 試行回数 = ${state.retryCount + 1}`);
  
  if (state.retryCount < 3) {
    return new Command({
      update: { 
        retryCount: state.retryCount + 1,
      },
      goto: "retryable"  // 自分自身へ遷移することで再実行
    });
  }
  
  return { 
    result: "最大試行回数に達しました",
    processed: true 
  };
};

// グラフの構築
const buildBasicGraph = () => {
  const graph = new StateGraph(StateAnnotation)
    .addNode("myNode", myNode, { 
      ends: ["myOtherNode"]  // Commandで遷移する可能性のあるノードを指定
    })
    .addNode("myOtherNode", myOtherNode)
    .addEdge("__start__", "myNode");
    
  return graph.compile();
};

const buildRouterGraph = () => {
  const graph = new StateGraph(StateAnnotation)
    .addNode("router", routerNode, {
      ends: ["celebrateNode", "passNode", "retryNode"]  // 3つの遷移先を指定
    })
    .addNode("celebrateNode", celebrateNode)
    .addNode("passNode", passNode)
    .addNode("retryNode", retryNode)
    .addEdge("__start__", "router");
    
  return graph.compile();
};

const buildRetryGraph = () => {
  const graph = new StateGraph(StateAnnotation)
    .addNode("retryable", retryableNode, {
      ends: ["retryable"]  // 自分自身へ遷移する可能性があることを指定
    })
    .addEdge("__start__", "retryable");
    
  return graph.compile();
};

// 実行例
async function main() {
  console.log("=== 基本的なCommand例 ===");
  const basicGraph = buildBasicGraph();
  const basicResult = await basicGraph.invoke({
    foo: "initial",
    bar: "initial",
    score: 0,
    result: "",
    processed: false,
  });
  console.log("最終状態:", basicResult);
  
  console.log("\n=== 動的ルーティング例 (スコア: 90) ===");
  const routerGraph = buildRouterGraph();
  const highScoreResult = await routerGraph.invoke({
    foo: "",
    bar: "",
    score: 90,
    result: "",
    processed: false,
  });
  console.log("最終状態:", highScoreResult);
  
  console.log("\n=== 動的ルーティング例 (スコア: 50) ===");
  const lowScoreResult = await routerGraph.invoke({
    foo: "",
    bar: "",
    score: 50,
    result: "",
    processed: false,
  });
  console.log("最終状態:", lowScoreResult);
  
  console.log("\n=== ループ実行例（自分自身へのgoto） ===");
  const retryGraph = buildRetryGraph();
  const retryResult = await retryGraph.invoke({
    foo: "",
    bar: "",
    score: 0,
    result: "",
    processed: false,
    retryCount: 0,
  });
  console.log("最終状態:", retryResult);
}

// 実行
main().catch(console.error);