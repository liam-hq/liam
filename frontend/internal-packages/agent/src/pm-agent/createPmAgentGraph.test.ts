import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createPmAgentGraph } from './createPmAgentGraph'

describe('createPmAgentGraph', () => {
  const expectedMermaidDiagram = `%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	analyzeRequirements(analyzeRequirements)
	invokeSaveArtifactTool(invokeSaveArtifactTool)
	__end__([<p>__end__</p>]):::last
	__start__ --> analyzeRequirements;
	invokeSaveArtifactTool --> analyzeRequirements;
	analyzeRequirements -.-> invokeSaveArtifactTool;
	analyzeRequirements -. &nbsp;END&nbsp; .-> __end__;
	analyzeRequirements -.-> analyzeRequirements;
	classDef default fill:#f2f0ff,line-height:1.2;
	classDef first fill-opacity:0;
	classDef last fill:#bfb6fc;
`

  it('should create and return a compiled PM Agent subgraph', async () => {
    const compiledPmAgentGraph = createPmAgentGraph()
    expect(compiledPmAgentGraph).toBeDefined()

    const graph = await compiledPmAgentGraph.getGraphAsync()
    const mermaid = graph.drawMermaid()
    expect(mermaid).toEqual(expectedMermaidDiagram)
  })

  it('should have the same diagram in README.md as the generated graph', () => {
    const readmePath = join(__dirname, '..', '..', 'README.md')
    const readmeContent = readFileSync(readmePath, 'utf-8')

    // Check that the README contains the expected Mermaid diagram
    expect(readmeContent).toContain(expectedMermaidDiagram)
  })
})
