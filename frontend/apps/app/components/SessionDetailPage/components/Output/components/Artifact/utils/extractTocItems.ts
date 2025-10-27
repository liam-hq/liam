import type { TocItem } from '../types'
import { generateHeadingId } from '.'

const stripInlineMarkdown = (input: string): string => {
  let s = input.trim()
  // Remove trailing ATX closing hashes (e.g. '### Title ###' → '### Title')
  s = s.replace(/\s+#+\s*$/u, '')
  // Images: '![alt](url)' → 'alt'
  s = s.replace(/!\[([^\]]*)\]\((?:[^)]+)\)/gu, '$1')
  // Links: '[text](url)' → 'text'
  s = s.replace(/\[([^\]]+)\]\((?:[^)]+)\)/gu, '$1')
  // Inline code: '`code`' → 'code'
  s = s.replace(/`([^`]+)`/gu, '$1')
  // Emphasis (bold+italic): '***text***' or '___text___' → 'text'
  s = s.replace(/(\*\*\*|___)(.*?)\1/gu, '$2')
  // Emphasis (bold): '**text**' or '__text__' → 'text'
  s = s.replace(/(\*\*|__)(.*?)\1/gu, '$2')
  // Emphasis (italic): '*text*' or '_text_' → 'text'
  s = s.replace(/(\*|_)([^*_][\s\S]*?)\1/gu, '$2')
  // Strikethrough: '~~text~~' → 'text'
  s = s.replace(/~~(.*?)~~/gu, '$1')
  // Remove HTML tags conservatively and then drop any stray angle brackets
  s = s.replace(/<\/?[\p{L}][^>]*>/gu, '')
  s = s.replace(/[<>]/gu, '')
  // Unescape backslash-escaped punctuation: '\*' → '*'
  s = s.replace(/\\([\\`*_{}\[\]()#+\-.!])/gu, '$1')
  // Collapse multiple spaces and trim
  s = s.replace(/\s+/gu, ' ').trim()
  return s
}

export const parseHeading = (
  line: string,
  slugCountMap: Map<string, number>,
): TocItem | null => {
  const headingMatch = line.match(/^(#{1,5})\s+(.+)$/)
  if (!headingMatch) return null

  const levelMatch = headingMatch[1]
  const rawText = headingMatch[2]
  const text = stripInlineMarkdown(rawText ?? '')
  if (!levelMatch || !text) return null

  const level = levelMatch.length
  const baseSlug = generateHeadingId(text)

  if (!baseSlug) return null

  // Handle duplicate slugs
  const count = slugCountMap.get(baseSlug) ?? 0
  slugCountMap.set(baseSlug, count + 1)

  const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`

  return { id, text, level }
}

export const extractTocItems = (content: string): TocItem[] => {
  const items: TocItem[] = []
  const lines = content.split('\n')
  const slugCountMap = new Map<string, number>()

  for (const line of lines) {
    const heading = parseHeading(line, slugCountMap)
    if (heading) {
      items.push(heading)
    }
  }

  return items
}
