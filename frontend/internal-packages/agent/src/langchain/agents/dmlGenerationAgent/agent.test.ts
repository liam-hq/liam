import { describe, expect, it } from 'vitest'
import { DMLGenerationAgent } from './agent'

describe('DMLGenerationAgent', () => {
  it('should create an instance of DMLGenerationAgent', () => {
    const agent = new DMLGenerationAgent()
    expect(agent).toBeDefined()
    expect(agent).toBeInstanceOf(DMLGenerationAgent)
  })

  it('should have a generate method', () => {
    const agent = new DMLGenerationAgent()
    expect(agent.generate).toBeDefined()
    expect(typeof agent.generate).toBe('function')
  })

  it('should return dmlStatements from generate method', async () => {
    const agent = new DMLGenerationAgent()
    const input = {
      schemaSQL: 'CREATE TABLE users (id INT PRIMARY KEY);',
      formattedUseCases: 'User registration use case',
      schemaContext: 'Mock schema context',
    }

    const result = await agent.generate(input)

    expect(result).toBeDefined()
    expect(result.dmlStatements).toBeDefined()
    expect(typeof result.dmlStatements).toBe('string')
  })
})
