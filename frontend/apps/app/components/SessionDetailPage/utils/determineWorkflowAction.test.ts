import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import { determineWorkflowAction } from './determineWorkflowAction'

describe('determineWorkflowAction', () => {
  describe('Priority 1: Already triggered', () => {
    it('returns none when hasTriggered is true', () => {
      const result = determineWorkflowAction(
        [new HumanMessage('test')],
        false, // isWorkflowInProgress
        true, // hasTriggered
      )
      expect(result).toEqual({ type: 'none' })
    })

    it('returns none even when both hasTriggered and isWorkflowInProgress are true', () => {
      const result = determineWorkflowAction(
        [new HumanMessage('test')],
        true, // isWorkflowInProgress
        true, // hasTriggered
      )
      expect(result).toEqual({ type: 'none' })
    })
  })

  describe('Priority 2: Workflow in progress flag exists', () => {
    it('returns replay when isWorkflowInProgress is true', () => {
      const result = determineWorkflowAction(
        [],
        true, // isWorkflowInProgress
        false, // hasTriggered
      )
      expect(result).toEqual({ type: 'replay' })
    })

    it('returns replay even with multiple messages when isWorkflowInProgress is true', () => {
      const result = determineWorkflowAction(
        [new HumanMessage('first'), new AIMessage('response')],
        true, // isWorkflowInProgress
        false, // hasTriggered
      )
      expect(result).toEqual({ type: 'replay' })
    })
  })

  describe('Priority 3: Single unanswered user message', () => {
    it('returns start when there is a single HumanMessage', () => {
      const result = determineWorkflowAction(
        [new HumanMessage('hello')],
        false, // isWorkflowInProgress
        false, // hasTriggered
      )
      expect(result).toEqual({
        type: 'start',
        userInput: 'hello',
      })
    })

    it('handles when content is not a string', () => {
      const message = new HumanMessage({ content: 'test' })
      const result = determineWorkflowAction([message], false, false)
      expect(result.type).toBe('start')
    })
  })

  describe('Priority 4: Do nothing', () => {
    it('returns none when messages is empty', () => {
      const result = determineWorkflowAction([], false, false)
      expect(result).toEqual({ type: 'none' })
    })

    it('returns none when there are multiple messages', () => {
      const result = determineWorkflowAction(
        [new HumanMessage('first'), new AIMessage('response')],
        false,
        false,
      )
      expect(result).toEqual({ type: 'none' })
    })

    it('returns none when single message is AIMessage', () => {
      const result = determineWorkflowAction(
        [new AIMessage('ai message')],
        false,
        false,
      )
      expect(result).toEqual({ type: 'none' })
    })
  })
})
