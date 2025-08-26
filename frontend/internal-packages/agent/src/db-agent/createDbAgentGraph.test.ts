import { describe, expect, it } from 'vitest'
import { createDbAgentGraph } from './createDbAgentGraph'

describe('createDbAgentGraph', () => {
  const expectedMermaidDiagram = `%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	designSchema(designSchema)
	invokeSchemaDesignTool(invokeSchemaDesignTool)
	__end__([<p>__end__</p>]):::last
	__start__ --> designSchema;
	invokeSchemaDesignTool --> designSchema;
	designSchema -.-> invokeSchemaDesignTool;
	designSchema -. &nbsp;generateTestcase&nbsp; .-> __end__;
	classDef default fill:#f2f0ff,line-height:1.2;
	classDef first fill-opacity:0;
	classDef last fill:#bfb6fc;
`

  it('should create and return a compiled DB Agent subgraph', async () => {
    const compiledDbAgentGraph = createDbAgentGraph()
    expect(compiledDbAgentGraph).toBeDefined()

    const graph = await compiledDbAgentGraph.getGraphAsync()
    const mermaid = graph.drawMermaid()
    expect(mermaid).toEqual(expectedMermaidDiagram)
  })

  it('should have correct node structure for iterative design process', async () => {
    const compiledDbAgentGraph = createDbAgentGraph()
    const graph = await compiledDbAgentGraph.getGraphAsync()

    // Check that required nodes exist
    const nodeNames = Object.keys(graph.nodes)
    expect(nodeNames).toContain('designSchema')
    expect(nodeNames).toContain('invokeSchemaDesignTool')
  })

  it('should start with designSchema node', async () => {
    const compiledDbAgentGraph = createDbAgentGraph()
    const graph = await compiledDbAgentGraph.getGraphAsync()

    // Check that the graph starts with designSchema by examining edges from START
    const startEdges = graph.edges.filter((edge) => edge.source === '__start__')
    const targetNodes = startEdges.map((edge) => edge.target)
    expect(targetNodes).toContain('designSchema')
  })

  it('should have conditional routing from designSchema', async () => {
    const compiledDbAgentGraph = createDbAgentGraph()
    const graph = await compiledDbAgentGraph.getGraphAsync()

    // Check that designSchema has conditional edges
    const designSchemaEdges = graph.edges.filter(
      (edge) => edge.source === 'designSchema',
    )
    expect(designSchemaEdges.length).toBeGreaterThan(1) // Should have multiple conditional edges
  })
})
