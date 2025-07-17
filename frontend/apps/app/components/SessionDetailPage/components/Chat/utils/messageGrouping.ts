import type { TimelineItemEntry } from '../../../types'

type MessageGroup = {
  id: string
  type: TimelineItemEntry['type']
  sender: string
  messages: TimelineItemEntry[]
  startTime: Date
  endTime: Date
}

/**
 * Groups consecutive messages from the same sender
 */
export const groupConsecutiveMessages = (
  items: TimelineItemEntry[],
): (TimelineItemEntry | MessageGroup)[] => {
  if (items.length === 0) return []

  const result: (TimelineItemEntry | MessageGroup)[] = []
  let currentGroup: TimelineItemEntry[] = []
  let currentSender = ''

  const getSenderKey = (item: TimelineItemEntry): string => {
    // Group agent messages together (all assistant types)
    if (
      item.type === 'assistant' ||
      item.type === 'assistant_pm' ||
      item.type === 'assistant_db' ||
      item.type === 'assistant_qa' ||
      item.type === 'assistant_log'
    ) {
      return 'assistant_group'
    }
    // Don't group other types (user, error, schema_version)
    return `${item.type}_${item.id}`
  }

  const flushGroup = () => {
    if (currentGroup.length === 0) return

    if (currentGroup.length === 1) {
      result.push(currentGroup[0])
    } else {
      const group: MessageGroup = {
        id: `group_${currentGroup[0].id}`,
        type: currentGroup[0].type,
        sender: currentSender,
        messages: currentGroup,
        startTime: currentGroup[0].timestamp,
        endTime: currentGroup[currentGroup.length - 1].timestamp,
      }
      result.push(group)
    }
    currentGroup = []
  }

  items.forEach((item) => {
    const senderKey = getSenderKey(item)

    if (senderKey !== currentSender) {
      flushGroup()
      currentSender = senderKey
    }

    currentGroup.push(item)
  })

  flushGroup()
  return result
}

/**
 * Type guard to check if an item is a MessageGroup
 */
export const isMessageGroup = (
  item: TimelineItemEntry | MessageGroup,
): item is MessageGroup => {
  return 'messages' in item && Array.isArray(item.messages)
}
