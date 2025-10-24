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

  it('should return "column|users|id" when suggestion is "id" column in "users" table', () => {
    const suggestion: CommandPaletteSuggestion = {
      type: 'column',
      tableName: 'users',
      columnName: 'id',
    }

    const result = getSuggestionText(suggestion)

    expect(result).toBe('column|users|id')
  })

  it('should return "index|users|users_on_status_id" when suggestion is "users_on_status_id" index in "users" table', () => {
    const suggestion: CommandPaletteSuggestion = {
      type: 'index',
      tableName: 'users',
      indexName: 'users_on_status_id',
    }

    const result = getSuggestionText(suggestion)

    expect(result).toBe('index|users|users_on_status_id')
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

  it('should return the "id" column in "users" table suggestion when suggestion text is "column|posts|created_at"', () => {
    const suggestionText = 'column|posts|created_at'

    const result = textToSuggestion(suggestionText)

    expect(result).toEqual({
      type: 'column',
      tableName: 'posts',
      columnName: 'created_at',
    })
  })

  it('should return the "posts_on_user_id" index in "posts" table suggestion when suggestion text is "index|posts|posts_on_user_id"', () => {
    const suggestionText = 'index|posts|posts_on_user_id'

    const result = textToSuggestion(suggestionText)

    expect(result).toEqual({
      type: 'index',
      tableName: 'posts',
      indexName: 'posts_on_user_id',
    })
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

    it('should return null when a column name is empty', () => {
      const suggestionText = 'column|users|'

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
      { type: 'column', tableName: 'users', columnName: 'email' },
      { type: 'index', tableName: 'posts', indexName: 'post_on_status_id' },
    ])('in case: %p', (suggestion) => {
      const result = textToSuggestion(getSuggestionText(suggestion))

      expect(result).toEqual(suggestion)
    })
  })
})
