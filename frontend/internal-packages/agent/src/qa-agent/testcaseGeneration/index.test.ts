import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { testcaseGeneration } from './index'

describe('testcaseGeneration', () => {
  const expectedMermaidDiagram = `%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	validateSchemaRequirements(validateSchemaRequirements)
	generateTestcase(generateTestcase)
	invokeSaveTool(invokeSaveTool)
	__end__([<p>__end__</p>]):::last
	__start__ --> validateSchemaRequirements;
	generateTestcase -.-> invokeSaveTool;
	generateTestcase -.-> __end__;
	invokeSaveTool -.-> generateTestcase;
	invokeSaveTool -.-> __end__;
	validateSchemaRequirements -.-> generateTestcase;
	validateSchemaRequirements -.-> __end__;
	classDef default fill:#f2f0ff,line-height:1.2;
	classDef first fill-opacity:0;
	classDef last fill:#bfb6fc;
`

  it('should create and return a compiled testcase generation subgraph', async () => {
    const compiledTestcaseGraph = testcaseGeneration

    const graph = await compiledTestcaseGraph.getGraphAsync()
    const mermaid = graph.drawMermaid()
    expect(mermaid).toEqual(expectedMermaidDiagram)
  })

  it('should have the same diagram in README.md as the generated graph', () => {
    const readmePath = join(__dirname, '..', '..', '..', 'README.md')
    const readmeContent = readFileSync(readmePath, 'utf-8')

    expect(readmeContent).toContain(expectedMermaidDiagram)
  })
})
