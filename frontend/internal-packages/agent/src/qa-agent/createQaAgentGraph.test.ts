import { describe, expect, it } from 'vitest'
import { createQaAgentGraph } from './createQaAgentGraph'

describe('createQaAgentGraph', () => {
  const expectedMermaidDiagram = `%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	generateTestcase(generateTestcase)
	prepareDML(prepareDML)
	validateSchema(validateSchema)
	__end__([<p>__end__</p>]):::last
	__start__ --> generateTestcase;
	generateTestcase --> prepareDML;
	prepareDML --> validateSchema;
	validateSchema --> __end__;
	classDef default fill:#f2f0ff,line-height:1.2;
	classDef first fill-opacity:0;
	classDef last fill:#bfb6fc;
`

  it('should create and return a compiled QA Agent subgraph', async () => {
    const compiledQaAgentGraph = createQaAgentGraph()
    expect(compiledQaAgentGraph).toBeDefined()

    const graph = await compiledQaAgentGraph.getGraphAsync()
    const mermaid = graph.drawMermaid()
    expect(mermaid).toEqual(expectedMermaidDiagram)
  })

  it('should have correct node structure for QA testing process', async () => {
    const compiledQaAgentGraph = createQaAgentGraph()
    const graph = await compiledQaAgentGraph.getGraphAsync()

    // Check that required nodes exist
    const nodeNames = Object.keys(graph.nodes)
    expect(nodeNames).toContain('generateTestcase')
    expect(nodeNames).toContain('prepareDML')
    expect(nodeNames).toContain('validateSchema')
  })

  it('should start with generateTestcase node', async () => {
    const compiledQaAgentGraph = createQaAgentGraph()
    const graph = await compiledQaAgentGraph.getGraphAsync()

    // Check that the graph starts with generateTestcase by examining edges from START
    const startEdges = graph.edges.filter((edge) => edge.source === '__start__')
    const targetNodes = startEdges.map((edge) => edge.target)
    expect(targetNodes).toContain('generateTestcase')
  })

  it('should have linear flow from generateTestcase to validateSchema', async () => {
    const compiledQaAgentGraph = createQaAgentGraph()
    const graph = await compiledQaAgentGraph.getGraphAsync()

    const generateTestcaseEdges = graph.edges.filter(
      (edge) => edge.source === 'generateTestcase',
    )
    expect(
      generateTestcaseEdges.some((edge) => edge.target === 'prepareDML'),
    ).toBe(true)

    const prepareDMLEdges = graph.edges.filter(
      (edge) => edge.source === 'prepareDML',
    )
    expect(
      prepareDMLEdges.some((edge) => edge.target === 'validateSchema'),
    ).toBe(true)

    const validateSchemaEdges = graph.edges.filter(
      (edge) => edge.source === 'validateSchema',
    )
    expect(validateSchemaEdges.some((edge) => edge.target === '__end__')).toBe(
      true,
    )
  })
})
