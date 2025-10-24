import type { CommandPaletteSuggestion } from '../types'

const SEPARATOR = '|'

export const getSuggestionText = (suggestion: CommandPaletteSuggestion) => {
  if (suggestion.type === 'column') {
    return `${suggestion.type}${SEPARATOR}${suggestion.tableName}${SEPARATOR}${suggestion.columnName}`
  }
  if (suggestion.type === 'index') {
    return `${suggestion.type}${SEPARATOR}${suggestion.tableName}${SEPARATOR}${suggestion.indexName}`
  }
  return `${suggestion.type}${SEPARATOR}${suggestion.name}`
}

export const textToSuggestion = (
  text: string,
): CommandPaletteSuggestion | null => {
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log(text)

  const words = text.split(SEPARATOR)

  const [suggestionType, name1, name2] = words
  if (!suggestionType) return null

  if (suggestionType === 'table' || suggestionType === 'command') {
    if (!name1) return null
    return { type: suggestionType, name: name1 }
  }

  if (suggestionType === 'column') {
    if (!name1 || !name2) return null
    return { type: 'column', tableName: name1, columnName: name2 }
  }

  if (suggestionType === 'index') {
    if (!name1 || !name2) return null
    return { type: 'index', tableName: name1, indexName: name2 }
  }

  return null
}
