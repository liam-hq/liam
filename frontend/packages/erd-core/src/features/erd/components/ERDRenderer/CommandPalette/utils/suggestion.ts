import type { CommandPaletteSuggestion } from '../types'

const SEPARATOR = '|'

export const getSuggestionText = (suggestion: CommandPaletteSuggestion) =>
  `${suggestion.type}${SEPARATOR}${suggestion.name}`

export const textToSuggestion = (
  text: string,
): CommandPaletteSuggestion | null => {
  const words = text.split(SEPARATOR)

  const [suggestionType, name] = words
  if (!suggestionType || !name) return null

  if (suggestionType === 'table' || suggestionType === 'command')
    return { type: suggestionType, name }

  return null
}
