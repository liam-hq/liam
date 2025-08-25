import { describe, expect, it } from 'vitest'
import type { CommandPaletteSuggestion } from '../types'
import { getSuggestionText, textToSuggestion } from './suggestion'

describe('getSuggestionText', () => {
  it('should return "table|users" when suggestion is "user" table', () => {
    const suggestion: CommandPaletteSuggestion = {
      type: 'table',
      name: 'users',
    }

    const result = getSuggestionText(suggestion)

    expect(result).toBe('table|users')
  })

  it('should return "command|show tables" when suggestion is "show tables" command', () => {
    const suggestion: CommandPaletteSuggestion = {
      type: 'command',
      name: 'show tables',
    }

    const result = getSuggestionText(suggestion)

    expect(result).toBe('command|show tables')
  })
})

describe('textToSuggestion', () => {
  it('should return the "posts" table suggestion when suggestion text is "table|posts"', () => {
    const suggestionText = 'table|posts'

    const result = textToSuggestion(suggestionText)

    expect(result).toEqual({ type: 'table', name: 'posts' })
  })

  it('should return the "hide tables" command suggestion when suggestion text is "command|hide tables"', () => {
    const suggestionText = 'command|hide tables'

    const result = textToSuggestion(suggestionText)

    expect(result).toEqual({ type: 'command', name: 'hide tables' })
  })

  describe('with unexpected formats', () => {
    it('should return null when an unknown suggested type is given', () => {
      const suggestionText = 'fruits|lemon'

      const result = textToSuggestion(suggestionText)

      expect(result).toBeNull()
    })

    it('should return null when a table name is empty', () => {
      const suggestionText = 'table|'

      const result = textToSuggestion(suggestionText)

      expect(result).toBeNull()
    })
  })
})

describe('integration test, (value) => textToSuggestion(getSuggestionText(value))', () => {
  describe('it should return the input value', () => {
    it.each<CommandPaletteSuggestion>([
      { type: 'table', name: 'user_posts' },
      { type: 'command', name: 'export as CSV' },
    ])('in case: %p', (suggestion) => {
      const result = textToSuggestion(getSuggestionText(suggestion))

      expect(result).toEqual(suggestion)
    })
  })
})
