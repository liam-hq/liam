import type { TimelineItemEntry } from '../../../types'

export type AgentStep = {
  agent: 'pm' | 'db' | 'qa'
  task: string
  willFail?: boolean
  type?: string
}

export type RecoveryStep = {
  agent: 'pm' | 'db' | 'qa'
  task: string
  type: string
  willFail?: boolean
}

// Step thresholds for agent progress checks
const PM_AGENT_MAX_STEP = 3
const DB_SCHEMA_MAX_STEP = 6
const DB_CREATION_MAX_STEP = 9

export const createDynamicTimelineItems = (
  currentStep: number,
  currentIndex: number,
  agentSteps: AgentStep[],
  _recoverySteps: RecoveryStep[],
  mockTimelineItems: TimelineItemEntry[],
  _isPlaying: boolean,
): TimelineItemEntry[] => {
  const items: TimelineItemEntry[] = []

  // Add user message first
  if (mockTimelineItems.length > 0) {
    items.push(mockTimelineItems[0])
  }

  // For PM agent steps (1-3)
  if (currentStep > 0 && currentStep <= PM_AGENT_MAX_STEP) {
    const pmMessages = mockTimelineItems
      .filter(
        (item) =>
          item.id.includes('timeline-pm-agent-') &&
          item.type === 'assistant_log',
      )
      .slice(0, 3)

    const messagesToShow = pmMessages.slice(0, currentStep)
    messagesToShow.forEach((msg) => items.push(msg))
  }

  // For DB agent schema design steps (4-6)
  if (currentStep > PM_AGENT_MAX_STEP && currentStep <= DB_SCHEMA_MAX_STEP) {
    // Add all PM messages
    const pmMessages = mockTimelineItems
      .filter(
        (item) =>
          item.id.includes('timeline-pm-agent-') &&
          item.type === 'assistant_log',
      )
      .slice(0, 3)
    pmMessages.forEach((msg) => items.push(msg))

    // Add DB schema messages
    const dbSchemaMessages = mockTimelineItems
      .filter(
        (item) =>
          item.id.includes('timeline-db-agent-') &&
          item.type === 'assistant_log',
      )
      .slice(0, 3)

    const dbMessagesToShow = dbSchemaMessages.slice(
      0,
      currentStep - PM_AGENT_MAX_STEP,
    )
    dbMessagesToShow.forEach((msg) => items.push(msg))
  }

  // For DB creation steps (7-9)
  if (currentStep > DB_SCHEMA_MAX_STEP && currentStep <= DB_CREATION_MAX_STEP) {
    // Add all PM messages
    const pmMessages = mockTimelineItems
      .filter(
        (item) =>
          item.id.includes('timeline-pm-agent-') &&
          item.type === 'assistant_log',
      )
      .slice(0, 3)
    pmMessages.forEach((msg) => items.push(msg))

    // Add all DB schema messages
    const dbSchemaMessages = mockTimelineItems
      .filter(
        (item) =>
          item.id.includes('timeline-db-agent-') &&
          item.type === 'assistant_log',
      )
      .slice(0, 3)
    dbSchemaMessages.forEach((msg) => items.push(msg))

    // Add schema version
    const schemaVersion = mockTimelineItems.find(
      (item) => item.type === 'schema_version',
    )
    if (schemaVersion) items.push(schemaVersion)

    // Add DB creation messages
    const dbCreationMessages = mockTimelineItems
      .filter(
        (item) =>
          item.id.includes('timeline-qa-agent-') &&
          item.type === 'assistant_log',
      )
      .slice(0, 3)

    const creationMessagesToShow = dbCreationMessages.slice(
      0,
      currentStep - DB_SCHEMA_MAX_STEP,
    )
    creationMessagesToShow.forEach((msg) => items.push(msg))
  }

  // Handle completed animation and recovery steps
  if (currentStep >= agentSteps.length) {
    // Show all messages up to the first error
    const errorIndex = mockTimelineItems.findIndex(
      (item) => item.type === 'error',
    )
    if (errorIndex > 0) {
      mockTimelineItems
        .slice(1, errorIndex + 1)
        .forEach((msg) => items.push(msg))
    }

    // Handle recovery animation
    if (currentIndex > 0) {
      const remainingMessages = mockTimelineItems.slice(errorIndex + 1)
      const messagesToShow = remainingMessages.slice(0, currentIndex)
      messagesToShow.forEach((msg) => items.push(msg))
    }
  }

  return items
}
