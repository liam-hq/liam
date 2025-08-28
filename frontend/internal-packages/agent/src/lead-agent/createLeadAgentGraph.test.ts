import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createLeadAgentGraph } from './createLeadAgentGraph'

describe('createLeadAgentGraph', () => {
  const expectedMermaidDiagram = `%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	classify(classify)
	summarizeWorkflow(summarizeWorkflow)
	__end__([<p>__end__</p>]):::last
	__start__ --> classify;
	summarizeWorkflow --> __end__;
	classify -.-> summarizeWorkflow;
	classify -.-> __end__;
	classDef default fill:#f2f0ff,line-height:1.2;
	classDef first fill-opacity:0;
	classDef last fill:#bfb6fc;
`

  it('should create and return a compiled Lead Agent subgraph', async () => {
    const compiledLeadAgentGraph = createLeadAgentGraph()
    expect(compiledLeadAgentGraph).toBeDefined()

    const graph = await compiledLeadAgentGraph.getGraphAsync()
    const mermaid = graph.drawMermaid()
    expect(mermaid).toEqual(expectedMermaidDiagram)
  })

  it('should have the same diagram in agent/README.md as the generated graph', () => {
    const readmePath = join(__dirname, '..', '..', 'README.md')
    const readmeContent = readFileSync(readmePath, 'utf-8')

    // Check that the README contains the expected Mermaid diagram
    expect(readmeContent).toContain(expectedMermaidDiagram)
  })
})
