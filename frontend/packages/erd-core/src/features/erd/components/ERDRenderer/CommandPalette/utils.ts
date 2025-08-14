import type { Suggestion } from './types'

export const getTableLinkHref = (activeTableName: string) => {
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('active', activeTableName)
  return `?${searchParams.toString()}`
}

export const suggestionToString = (suggestion: Suggestion) => {
  switch (suggestion.type) {
    case 'table':
      return `table|${suggestion.name}`
    case 'column':
      return `column|${suggestion.tableName}|${suggestion.name}`
    case 'command':
      return `command|${suggestion.name}`
  }
}

export const stringToSuggestion = (value: string): Suggestion | null => {
  if (value.startsWith('column|')) {
    const [, tableName, name, rest] = value.split('|')
    if (tableName !== undefined && name !== undefined && rest === undefined)
      return { type: 'column', tableName, name }

    return null
  }

  const [type, name, rest] = value.split('|')
  if (type !== 'table' && type !== 'command') return null
  if (name !== undefined && rest === undefined) {
    return { type, name }
  }

  return null
}
