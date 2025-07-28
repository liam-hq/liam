import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createGraph } from './createGraph'

describe('createGraph', () => {
  const expectedMermaidDiagram = `%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	analyzeSearchRequirement(analyzeSearchRequirement)
	analyzeRequirements(analyzeRequirements)
	designSchema(designSchema)
	invokeSchemaDesignTool(invokeSchemaDesignTool)
	executeDDL(executeDDL)
	generateUsecase(generateUsecase)
	prepareDML(prepareDML)
	validateSchema(validateSchema)
	finalizeArtifacts(finalizeArtifacts)
	__end__([<p>__end__</p>]):::last
	__start__ --> analyzeSearchRequirement;
	analyzeRequirements --> designSchema;
	analyzeSearchRequirement --> analyzeRequirements;
	executeDDL --> generateUsecase;
	finalizeArtifacts --> __end__;
	generateUsecase --> prepareDML;
	invokeSchemaDesignTool --> designSchema;
	prepareDML --> validateSchema;
	designSchema -.-> invokeSchemaDesignTool;
	designSchema -.-> executeDDL;
	executeDDL -.-> designSchema;
	executeDDL -.-> finalizeArtifacts;
	executeDDL -.-> generateUsecase;
	validateSchema -.-> designSchema;
	validateSchema -.-> finalizeArtifacts;
	classDef default fill:#f2f0ff,line-height:1.2;
	classDef first fill-opacity:0;
	classDef last fill:#bfb6fc;
`

  it('should create and return a compiled graph', async () => {
    const compiledStateGraph = createGraph()
    expect(compiledStateGraph).toBeDefined()
    const graph = await compiledStateGraph.getGraphAsync()
    const mermaid = graph.drawMermaid()
    expect(mermaid).toEqual(expectedMermaidDiagram)
  })

  it('should have the same diagram in README.md as the generated graph', () => {
    const readmePath = join(__dirname, 'chat', 'workflow', 'README.md')
    const readmeContent = readFileSync(readmePath, 'utf-8')

    // Check that the README contains the expected Mermaid diagram
    expect(readmeContent).toContain(expectedMermaidDiagram)
  })
})
