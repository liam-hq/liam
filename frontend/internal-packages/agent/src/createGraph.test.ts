import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import { createGraph, fanOutDbAgent } from './createGraph'
import type { WorkflowState } from './types'

describe('createGraph', () => {
  const expectedMermaidDiagram = `%%{init: {'flowchart': {'curve': 'linear'}}}%%
graph TD;
	__start__([<p>__start__</p>]):::first
	validateInitialSchema(validateInitialSchema)
	leadAgent(leadAgent)
	pmAgent(pmAgent)
	dbAgent(dbAgent)
	qaAgent(qaAgent)
	__end__([<p>__end__</p>]):::last
	dbAgent --> qaAgent;
	qaAgent --> leadAgent;
	validateInitialSchema --> leadAgent;
	__start__ -.-> validateInitialSchema;
	__start__ -.-> leadAgent;
	leadAgent -.-> pmAgent;
	leadAgent -.-> __end__;
	pmAgent -.-> validateInitialSchema;
	pmAgent -.-> leadAgent;
	pmAgent -.-> dbAgent;
	pmAgent -.-> qaAgent;
	pmAgent -.-> __end__;
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

  it.skip('should have the same diagram in README.md as the generated graph', () => {
    const readmePath = join(__dirname, '..', 'README.md')
    const readmeContent = readFileSync(readmePath, 'utf-8')

    // Check that the README contains the expected Mermaid diagram
    // Note: README needs to be updated separately when graph structure changes
    expect(readmeContent).toContain(expectedMermaidDiagram)
  })
})

describe('fanOutDbAgent', () => {
  it('should create Send instances for each category', () => {
    const state: WorkflowState = {
      messages: [],
      analyzedRequirements: {
        businessRequirement: 'Test Business Requirement',
        functionalRequirements: {
          'User Management': [
            { id: 'req-func-1', desc: 'User authentication' },
            { id: 'req-func-2', desc: 'User profile management' },
          ],
          'Data Processing': [
            { id: 'req-func-3', desc: 'Data import/export' },
          ],
        },
        nonFunctionalRequirements: {
          Performance: [
            { id: 'req-nonfunc-1', desc: 'Response time < 2s' },
          ],
          Security: [
            { id: 'req-nonfunc-2', desc: 'Data encryption' },
            { id: 'req-nonfunc-3', desc: 'Access control' },
          ],
        },
      },
      testcases: [],
      schemaData: {
        tables: {},
        enums: {},
        extensions: {},
      },
      buildingSchemaId: 'test-schema-id',
      latestVersionNumber: 1,
      organizationId: 'test-org',
      userId: 'test-user',
      designSessionId: 'test-session',
      schemaIssues: [],
      next: END,
      prompt: undefined,
      currentRequirementId: undefined,
      currentRequirementCategory: undefined,
    }

    const result = fanOutDbAgent(state)

    // Should return array of Send instances - one per category
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(4) // 2 functional categories + 2 non-functional categories

    // Check that each is a Send instance pointing to dbAgent
    for (const send of result) {
      expect(send).toHaveProperty('node')
      expect(send.node).toBe('dbAgent')
    }
  })

  it('should return single Send when no requirements exist', () => {
    const state: WorkflowState = {
      messages: [],
      analyzedRequirements: {
        businessRequirement: 'Empty Requirements',
        functionalRequirements: {},
        nonFunctionalRequirements: {},
      },
      testcases: [],
      schemaData: {
        tables: {},
        enums: {},
        extensions: {},
      },
      buildingSchemaId: 'test-schema-id',
      latestVersionNumber: 1,
      organizationId: 'test-org',
      userId: 'test-user',
      designSessionId: 'test-session',
      schemaIssues: [],
      next: END,
      prompt: undefined,
      currentRequirementId: undefined,
      currentRequirementCategory: undefined,
    }

    const result = fanOutDbAgent(state)

    // Should return single Send instance
    expect(result).toHaveProperty('node')
    expect(result.node).toBe('dbAgent')
  })
})
