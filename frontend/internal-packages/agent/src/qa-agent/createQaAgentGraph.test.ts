import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createQaAgentGraph } from './createQaAgentGraph'

describe('createQaAgentGraph', () => {
  const expectedMermaidDiagram = `%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	generateTestcase(generateTestcase)
	generateDml(generateDml)
	invokeSaveDmlTool(invokeSaveDmlTool)
	validateSchema(validateSchema)
	__end__([<p>__end__</p>]):::last
	__start__ --> generateTestcase;
	generateTestcase --> generateDml;
	invokeSaveDmlTool --> generateDml;
	validateSchema --> __end__;
	generateDml -.-> invokeSaveDmlTool;
	generateDml -.-> validateSchema;
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

  it('should have the same diagram in README.md as the generated graph', () => {
    const readmePath = join(__dirname, '..', '..', 'README.md')
    const readmeContent = readFileSync(readmePath, 'utf-8')

    // Check that the README contains the expected Mermaid diagram
    expect(readmeContent).toContain(expectedMermaidDiagram)
  })
})
