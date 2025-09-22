import { generateHeadingId } from '../../utils'

export type TocItem = {
  id: string
  text: string
  level: number
}

export const parseHeading = (
  line: string,
  slugCountMap: Map<string, number>,
): TocItem | null => {
  const headingMatch = line.match(/^(#{1,5})\s+(.+)$/)
  if (!headingMatch) return null

  const levelMatch = headingMatch[1]
  const text = headingMatch[2]
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
