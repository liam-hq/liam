import { DEFAULT_TRIGGER } from '../constants'
import type { MentionItem } from '../types'

export const insertMentionAtCursor = (
  text: string,
  cursorPos: number,
  mention: MentionItem,
): string => {
  const before = text.slice(0, cursorPos)
  const match = new RegExp(`\\${DEFAULT_TRIGGER}([\\w-]*)$`).exec(before)
  if (!match) return text

  const start = cursorPos - match[0].length
  const after = text.slice(cursorPos)

  return `${text.slice(0, start)}${DEFAULT_TRIGGER}${mention.label} ${after}`
}
