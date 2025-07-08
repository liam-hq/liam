import { DEFAULT_TRIGGER } from '../../../constants'

export function extractActiveMention(text: string, cursorPos: number): string {
  const before = text.slice(0, cursorPos)
  const match = new RegExp(`\\${DEFAULT_TRIGGER}([\\w-]*)$`).exec(before)
  return match ? match[1] : ''
}
