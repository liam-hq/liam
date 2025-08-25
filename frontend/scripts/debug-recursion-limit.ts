#!/usr/bin/env node

// === Configuration ===
console.log('🔍 Starting debug: LangGraph.js Recursion Limit Behavior')
console.log('─'.repeat(60))

// Simulating LangGraph behavior based on documentation
interface GraphState {
  counter: number;
  messages: string[];
  loopCount: number;
  path: string[];
}

class GraphRecursionError extends Error {
  constructor(limit: number, actual: number) {
    super(`Recursion limit of ${limit} reached. Attempted ${actual} recursions.`);
    this.name = 'GraphRecursionError';
  }
}

// Simple graph simulator
class SimpleGraph {
  private nodes: Map<string, (state: GraphState) => Promise<Partial<GraphState>>> = new Map();
  private edges: Map<string, string | ((state: GraphState) => Promise<string>)> = new Map();
  private recursionCount = 0;
  
  addNode(name: string, fn: (state: GraphState) => Promise<Partial<GraphState>>) {
    this.nodes.set(name, fn);
  }
  
  addEdge(from: string, to: string | ((state: GraphState) => Promise<string>)) {
    this.edges.set(from, to);
  }
  
  async run(initialState: GraphState, recursionLimit: number = 100): Promise<GraphState> {
    let state = { ...initialState };
    let currentNode = 'START';
    this.recursionCount = 0;
    
    while (currentNode !== 'END') {
      // Each complete traversal (superstep) increments recursion count
      if (currentNode === 'START' || state.path.includes(currentNode)) {
        this.recursionCount++;
        console.log(`    📍 Recursion count: ${this.recursionCount}/${recursionLimit}`);
        
        if (this.recursionCount > recursionLimit) {
          throw new GraphRecursionError(recursionLimit, this.recursionCount);
        }
      }
      
      state.path.push(currentNode);
      
      // Execute node if it exists
      if (this.nodes.has(currentNode)) {
        const nodeFunc = this.nodes.get(currentNode)!;
        const updates = await nodeFunc(state);
        state = { ...state, ...updates };
      }
      
      // Get next node
      const edge = this.edges.get(currentNode);
      if (!edge) {
        break;
      }
      
      if (typeof edge === 'function') {
        currentNode = await edge(state);
      } else {
        currentNode = edge;
      }
    }
    
    return state;
  }
}

// === Debug Logic ===
async function debug() {
  console.log('📊 Testing when recursion counter increments\n');
  console.log('📖 Based on LangGraph.js documentation:');
  console.log('   • 1 recursion = 1 superstep = 1 complete graph traversal');
  console.log('   • Counter increments when entering a cycle/loop');
  console.log('   • Initial execution counts as recursion 1\n');

  // Test 1: Simple linear graph (no loops)
  console.log('TEST 1: Linear Graph (A → B → C → END)');
  console.log('Expected: 1 recursion (no loops, just linear execution)');
  await testLinearGraph();
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Test 2: Graph with conditional loop
  console.log('TEST 2: Self-Loop Graph');
  console.log('Expected: Each return to a visited node increments recursion');
  await testLoopingGraph();
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Test 3: Complex cycle
  console.log('TEST 3: Multi-Node Cycle (A → B → C → A)');
  console.log('Expected: Each complete cycle counts as 1 recursion');
  await testCycleGraph();
  
  console.log('─'.repeat(60));
  console.log('✅ Debug completed');
  
  console.log('\n📚 Summary of Recursion Counting Rules:');
  console.log('• Recursion counter starts at 1 for initial execution');
  console.log('• Increments by 1 each time graph returns to a previously visited node');
  console.log('• A "superstep" = one complete path through the graph until a cycle or END');
  console.log('• recursionLimit parameter prevents infinite loops');
}

// Test 1: Linear graph
async function testLinearGraph() {
  let stepCount = 0;
  const graph = new SimpleGraph();
  
  // Add nodes
  graph.addNode("nodeA", async (state) => {
    stepCount++;
    console.log(`  → Node A executed (step ${stepCount})`);
    return { 
      counter: state.counter + 1, 
      messages: [...state.messages, `A visited at step ${stepCount}`],
    };
  });
  
  graph.addNode("nodeB", async (state) => {
    stepCount++;
    console.log(`  → Node B executed (step ${stepCount})`);
    return { 
      counter: state.counter + 1, 
      messages: [...state.messages, `B visited at step ${stepCount}`],
    };
  });
  
  graph.addNode("nodeC", async (state) => {
    stepCount++;
    console.log(`  → Node C executed (step ${stepCount})`);
    return { 
      counter: state.counter + 1, 
      messages: [...state.messages, `C visited at step ${stepCount}`],
    };
  });
  
  // Add edges (linear path)
  graph.addEdge("START", "nodeA");
  graph.addEdge("nodeA", "nodeB");
  graph.addEdge("nodeB", "nodeC");
  graph.addEdge("nodeC", "END");
  
  try {
    const result = await graph.run(
      { counter: 0, messages: [], loopCount: 0, path: [] },
      10
    );
    console.log(`  ✓ Completed with ${stepCount} steps`);
    console.log(`  ✓ Final counter: ${result.counter}`);
    console.log(`  ✓ Path taken: ${result.path.join(' → ')}`);
  } catch (error: any) {
    console.log(`  ✗ Error: ${error.message}`);
  }
}

// Test 2: Self-looping graph
async function testLoopingGraph() {
  let stepCount = 0;
  const graph = new SimpleGraph();
  
  // Add node that loops to itself
  graph.addNode("process", async (state) => {
    stepCount++;
    console.log(`  → Process node (step ${stepCount}, loop ${state.loopCount + 1})`);
    return { 
      counter: state.counter + 1, 
      messages: [...state.messages, `Process at step ${stepCount}`],
      loopCount: state.loopCount + 1
    };
  });
  
  // Add edges with conditional logic
  graph.addEdge("START", "process");
  graph.addEdge("process", async (state) => {
    if (state.loopCount < 3) {
      console.log(`  ↻ Looping back to process (completed ${state.loopCount} loops)`);
      return "process";
    }
    console.log(`  ✓ Ending after ${state.loopCount} loops`);
    return "END";
  });
  
  // Test with different recursion limits
  console.log('\n  Testing with recursionLimit: 2');
  try {
    stepCount = 0;
    await graph.run(
      { counter: 0, messages: [], loopCount: 0, path: [] },
      2
    );
    console.log(`  ✓ Completed successfully`);
  } catch (error: any) {
    console.log(`  ✗ ${error.name}: Hit limit after ${stepCount} steps`);
  }
  
  console.log('\n  Testing with recursionLimit: 5');
  try {
    stepCount = 0;
    const result = await graph.run(
      { counter: 0, messages: [], loopCount: 0, path: [] },
      5
    );
    console.log(`  ✓ Completed ${result.loopCount} loops`);
    console.log(`  ✓ Total steps: ${stepCount}`);
    console.log(`  ✓ Path: ${result.path.slice(0, 10).join(' → ')}...`);
  } catch (error: any) {
    console.log(`  ✗ ${error.name}: ${error.message}`);
  }
}

// Test 3: Multi-node cycle graph
async function testCycleGraph() {
  let stepCount = 0;
  const graph = new SimpleGraph();
  
  // Create a cycle: A → B → C → A
  graph.addNode("nodeA", async (state) => {
    stepCount++;
    console.log(`  → Node A (step ${stepCount}, cycle ${Math.floor(state.loopCount / 3) + 1})`);
    return { 
      counter: state.counter + 1, 
      messages: [...state.messages, `A at step ${stepCount}`],
      loopCount: state.loopCount + 1
    };
  });
  
  graph.addNode("nodeB", async (state) => {
    stepCount++;
    console.log(`  → Node B (step ${stepCount}, cycle ${Math.floor(state.loopCount / 3) + 1})`);
    return { 
      counter: state.counter + 1, 
      messages: [...state.messages, `B at step ${stepCount}`],
      loopCount: state.loopCount + 1
    };
  });
  
  graph.addNode("nodeC", async (state) => {
    stepCount++;
    console.log(`  → Node C (step ${stepCount}, cycle ${Math.floor(state.loopCount / 3) + 1})`);
    return { 
      counter: state.counter + 1, 
      messages: [...state.messages, `C at step ${stepCount}`],
      loopCount: state.loopCount + 1
    };
  });
  
  // Create the cycle with conditional exit
  graph.addEdge("START", "nodeA");
  graph.addEdge("nodeA", "nodeB");
  graph.addEdge("nodeB", "nodeC");
  graph.addEdge("nodeC", async (state) => {
    const cycleCount = Math.floor(state.loopCount / 3);
    if (cycleCount < 2) {
      console.log(`  ↻ Completing cycle ${cycleCount + 1}, returning to A`);
      return "nodeA";
    }
    console.log(`  ✓ Ending after ${cycleCount} complete cycles`);
    return "END";
  });
  
  // Test with different recursion limits
  console.log('\n  Testing 3-node cycle with recursionLimit: 3');
  console.log('  (Should allow ~1 complete cycle)');
  try {
    stepCount = 0;
    await graph.run(
      { counter: 0, messages: [], loopCount: 0, path: [] },
      3
    );
    console.log(`  ✓ Completed successfully`);
  } catch (error: any) {
    console.log(`  ✗ ${error.name}: Hit limit after ${stepCount} steps`);
  }
  
  console.log('\n  Testing 3-node cycle with recursionLimit: 7');
  console.log('  (Should allow 2 complete cycles)');
  try {
    stepCount = 0;
    const result = await graph.run(
      { counter: 0, messages: [], loopCount: 0, path: [] },
      7
    );
    console.log(`  ✓ Completed after ${stepCount} steps`);
    console.log(`  ✓ Cycles completed: ${Math.floor(result.loopCount / 3)}`);
    console.log(`  ✓ Nodes visited: ${result.counter} times`);
  } catch (error: any) {
    console.log(`  ✗ ${error.name}: ${error.message}`);
  }
}

// === Execute ===
debug().catch(err => {
  console.error('❌ Debug failed:', err);
  process.exit(1);
});