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

// Named constants for improved readability
const DB_CREATION_STEP_THRESHOLD = 3
const MAX_ERROR_RECOVERY_STEPS_TO_SHOW = 10
// Offset from the total currentIndex to the recovery step index
// This represents the number of steps before recovery starts
const RECOVERY_STEP_INDEX_OFFSET = 8
// Indices for the initial completed messages in the mock timeline
// These represent the message indices that should be shown progressively
const INITIAL_COMPLETED_MESSAGE_INDICES = [8, 9, 10, 11]

// Step thresholds for agent progress checks
const PM_AGENT_MAX_STEP = 3
const DB_SCHEMA_MIN_STEP = 4
const DB_SCHEMA_MAX_STEP = 6
const DB_CREATION_MIN_STEP = 7
const DB_CREATION_MAX_STEP = 9

// Base timestamp for generating timeline entries
const BASE_TIMESTAMP = new Date('2025-07-14T06:39:00Z')

// Timeline timestamp configuration
const TIMELINE_TIMESTAMPS = {
  PM_PROGRESS: new Date(BASE_TIMESTAMP.getTime() + 10 * 1000), // +10 seconds
  DB_SCHEMA_PROGRESS: new Date(BASE_TIMESTAMP.getTime() + 15 * 1000), // +15 seconds
  DB_CREATION_PROGRESS: new Date(BASE_TIMESTAMP.getTime() + 30 * 1000), // +30 seconds
  ERROR_RECOVERY: new Date(BASE_TIMESTAMP.getTime() + 40 * 1000), // +40 seconds
  PM_RECOVERY: new Date(BASE_TIMESTAMP.getTime() + 65 * 1000), // +65 seconds
  DB_RECOVERY: new Date(BASE_TIMESTAMP.getTime() + 70 * 1000), // +70 seconds
  QA_RECOVERY: new Date(BASE_TIMESTAMP.getTime() + 75 * 1000), // +75 seconds
} as const

const generateAgentContent = (
  agentType: string,
  upToStep: number,
  agentSteps: AgentStep[],
  isPlaying: boolean,
): string => {
  const relevantSteps = agentSteps.filter(
    (step, idx) => step.agent === agentType && idx < upToStep,
  )

  let content = ''
  if (agentType === 'pm') {
    content = '📊 Requirements Analysis\n'
  } else if (agentType === 'db') {
    const firstRelevantStep = relevantSteps[0]
    if (firstRelevantStep) {
      const firstRelevantStepIndex = agentSteps.findIndex(
        (step) => step === firstRelevantStep,
      )
      const dbStepsBeforeRelevant =
        agentSteps
          .slice(0, firstRelevantStepIndex + 1)
          .filter((s) => s.agent === 'db').length - 1

      if (dbStepsBeforeRelevant >= DB_CREATION_STEP_THRESHOLD) {
        content = '💾 Database Creation\n'
      } else {
        content = '🏗️ Schema Design\n'
      }
    } else {
      content = '🏗️ Schema Design\n'
    }
  }

  relevantSteps.forEach((step) => {
    const isCurrentStep = agentSteps.indexOf(step) === upToStep - 1

    if (isCurrentStep && isPlaying) {
      content += `⏳ ${step.task}...\n`
    } else if (step.willFail && agentSteps.indexOf(step) < upToStep - 1) {
      content += `✗ ${step.task}...\n`
    } else if (agentSteps.indexOf(step) < upToStep - 1) {
      content += `✓ ${step.task}...\n`
    } else {
      content += `• ${step.task}...\n`
    }
  })

  return content.trim()
}

const formatTaskLine = (
  step: RecoveryStep,
  idx: number,
  localIndex: number,
  isPlaying: boolean,
): string => {
  if (idx === localIndex && isPlaying) {
    return `⏳ ${step.task}...\n`
  }
  if (idx < localIndex) {
    if (step.willFail) {
      return `✗ ${step.task}...\n`
    }
    return `✓ ${step.task}...\n`
  }
  return `• ${step.task}...\n`
}

const typeHeaders: Record<string, string> = {
  'error-recovery': '🔧 Error Recovery',
  'final-processing': '📋 Final Processing',
  'pm-2': '📊 Requirements Analysis',
  'db-4': '🏗️ Schema Design',
  'qa-2': '📦 Final Steps',
}

const generateRecoveryContent = (
  stepIndex: number,
  recoverySteps: RecoveryStep[],
  isPlaying: boolean,
): string => {
  if (stepIndex >= recoverySteps.length) return ''

  const currentStep = recoverySteps[stepIndex]
  let content = ''

  const header = typeHeaders[currentStep.type]
  if (!header) return ''

  content = `${header}\n`

  const relevantSteps = recoverySteps.filter((s) => s.type === currentStep.type)
  const localIndex =
    recoverySteps
      .slice(0, stepIndex + 1)
      .filter((s) => s.type === currentStep.type).length - 1

  const stepsToShow =
    currentStep.type === 'error-recovery'
      ? relevantSteps.slice(0, MAX_ERROR_RECOVERY_STEPS_TO_SHOW)
      : relevantSteps

  stepsToShow.forEach((step, idx) => {
    if (idx <= localIndex) {
      content += formatTaskLine(step, idx, localIndex, isPlaying)
    }
  })

  return content.trim()
}

const addPMAgentProgress = (
  items: TimelineItemEntry[],
  currentStep: number,
  agentSteps: AgentStep[],
  _isPlaying: boolean,
  mockTimelineItems: TimelineItemEntry[],
): void => {
  if (currentStep <= PM_AGENT_MAX_STEP) {
    // Generate individual log messages for each step
    const pmSteps = agentSteps.filter(
      (step, idx) => step.agent === 'pm' && idx < currentStep,
    )
    pmSteps.forEach((step, idx) => {
      const stepIndex = agentSteps.findIndex((s) => s === step)
      const isCurrentStep = stepIndex === currentStep - 1
      const isLastPMStep = idx === pmSteps.length - 1

      items.push({
        id: `timeline-pm-progress-${idx}`,
        type: 'assistant_log',
        role: 'pm',
        content: step.task,
        timestamp: new Date(
          TIMELINE_TIMESTAMPS.PM_PROGRESS.getTime() + idx * 2000,
        ),
      })
    })
  } else {
    // Add completed PM messages from mockTimelineItems
    const pmMessages = mockTimelineItems.filter(
      (item) =>
        item.type === 'assistant_log' &&
        'role' in item &&
        item.role === 'pm' &&
        item.id.includes('pm-agent'),
    )
    pmMessages.forEach((msg) => items.push(msg))
  }
}

const addDBAgentProgress = (
  items: TimelineItemEntry[],
  currentStep: number,
  agentSteps: AgentStep[],
  _isPlaying: boolean,
  mockTimelineItems: TimelineItemEntry[],
): void => {
  // For schema design phase
  if (currentStep >= DB_SCHEMA_MIN_STEP && currentStep <= DB_SCHEMA_MAX_STEP) {
    const dbSchemaSteps = agentSteps.filter(
      (step, idx) =>
        step.agent === 'db' &&
        idx >= DB_SCHEMA_MIN_STEP - 1 &&
        idx < currentStep &&
        idx <= DB_SCHEMA_MAX_STEP - 1,
    )

    dbSchemaSteps.forEach((step, idx) => {
      items.push({
        id: `timeline-db-schema-progress-${idx}`,
        type: 'assistant_log',
        role: 'db',
        content: step.task,
        timestamp: new Date(
          TIMELINE_TIMESTAMPS.DB_SCHEMA_PROGRESS.getTime() + idx * 2000,
        ),
      })
    })
  }

  // For database creation phase
  if (
    currentStep >= DB_CREATION_MIN_STEP &&
    currentStep <= DB_CREATION_MAX_STEP
  ) {
    // Add schema version message if exists
    if (mockTimelineItems[7]) {
      items.push(mockTimelineItems[7])
    }

    const dbCreationSteps = agentSteps.filter(
      (step, idx) =>
        step.agent === 'db' &&
        idx >= DB_CREATION_MIN_STEP - 1 &&
        idx < currentStep &&
        idx <= DB_CREATION_MAX_STEP - 1,
    )

    dbCreationSteps.forEach((step, idx) => {
      items.push({
        id: `timeline-db-creation-progress-${idx}`,
        type: 'assistant_log',
        role: 'db',
        content: step.task,
        timestamp: new Date(
          TIMELINE_TIMESTAMPS.DB_CREATION_PROGRESS.getTime() + idx * 2000,
        ),
      })
    })
  }
}

const addRecoveryMessages = (
  items: TimelineItemEntry[],
  recoveryStepIndex: number,
  recoverySteps: RecoveryStep[],
  isPlaying: boolean,
): void => {
  const currentStep = recoverySteps[recoveryStepIndex]
  const content = generateRecoveryContent(
    recoveryStepIndex,
    recoverySteps,
    isPlaying,
  )

  let assistantType: TimelineItemEntry['type'] = 'assistant_log'
  let role: 'pm' | 'db' | 'qa' = 'db'
  let timestamp = TIMELINE_TIMESTAMPS.ERROR_RECOVERY

  if (currentStep.type === 'pm-2') {
    assistantType = 'assistant'
    role = 'pm'
    timestamp = TIMELINE_TIMESTAMPS.PM_RECOVERY
  } else if (currentStep.type === 'db-4') {
    assistantType = 'assistant'
    role = 'db'
    timestamp = TIMELINE_TIMESTAMPS.DB_RECOVERY
  } else if (currentStep.type === 'qa-2') {
    assistantType = 'assistant'
    role = 'qa'
    timestamp = TIMELINE_TIMESTAMPS.QA_RECOVERY
  }

  if (assistantType === 'assistant') {
    items.push({
      id: `timeline-${currentStep.type}-progress`,
      type: 'assistant',
      role,
      content,
      timestamp,
    })
  } else {
    items.push({
      id: `timeline-${currentStep.type}-progress`,
      type: 'assistant_log',
      role: 'db',
      content,
      timestamp,
    })
  }
}

const addInitialCompletedMessages = (
  items: TimelineItemEntry[],
  mockTimelineItems: TimelineItemEntry[],
): void => {
  if (mockTimelineItems[3]) {
    items.push(mockTimelineItems[3])
  }
  if (mockTimelineItems[4]) {
    items.push(mockTimelineItems[4])
  }
}

const addPostRecoveryMessages = (
  items: TimelineItemEntry[],
  extraIndex: number,
  mockTimelineItems: TimelineItemEntry[],
): void => {
  // Check if index 7 exists before accessing
  if (mockTimelineItems[7]) {
    items.push(mockTimelineItems[7])
  }

  // Only create progressiveMessages array with existing items
  const progressiveMessages: TimelineItemEntry[] = []
  const indices = INITIAL_COMPLETED_MESSAGE_INDICES
  for (const index of indices) {
    if (mockTimelineItems[index]) {
      progressiveMessages.push(mockTimelineItems[index])
    }
  }

  for (let i = 0; i < Math.min(extraIndex, progressiveMessages.length); i++) {
    items.push(progressiveMessages[i])
  }

  // Check if index 15 exists before accessing
  if (extraIndex >= progressiveMessages.length + 1 && mockTimelineItems[15]) {
    items.push(mockTimelineItems[15])
  }
}

const addRecoveryAnimations = (
  items: TimelineItemEntry[],
  recoveryStepIndex: number,
  recoverySteps: RecoveryStep[],
  isPlaying: boolean,
): void => {
  const shownGroups = new Set<string>()

  for (
    let i = 0;
    i <= Math.min(recoveryStepIndex, recoverySteps.length - 1);
    i++
  ) {
    const step = recoverySteps[i]

    if (!shownGroups.has(step.type)) {
      shownGroups.add(step.type)
      addRecoveryMessages(items, i, recoverySteps, isPlaying)
    } else {
      const existingMessage = items.find(
        (item) => item.id === `timeline-${step.type}-progress`,
      )
      if (existingMessage) {
        existingMessage.content = generateRecoveryContent(
          i,
          recoverySteps,
          isPlaying,
        )
      }
    }
  }
}

const addPostAgentStepsMessages = (
  items: TimelineItemEntry[],
  currentStep: number,
  currentIndex: number,
  agentSteps: AgentStep[],
  recoverySteps: RecoveryStep[],
  mockTimelineItems: TimelineItemEntry[],
  isPlaying: boolean,
): void => {
  if (currentStep === agentSteps.length) {
    if (mockTimelineItems[5]) {
      items.push(mockTimelineItems[5])
    }
  }

  addInitialCompletedMessages(items, mockTimelineItems)

  if (currentIndex > 0) {
    if (mockTimelineItems?.[6]) {
      items.push(mockTimelineItems[6])
    }

    if (currentIndex >= RECOVERY_STEP_INDEX_OFFSET) {
      const recoveryStepIndex = currentIndex - RECOVERY_STEP_INDEX_OFFSET

      if (recoveryStepIndex < recoverySteps.length) {
        addRecoveryAnimations(
          items,
          recoveryStepIndex,
          recoverySteps,
          isPlaying,
        )
      } else {
        addRecoveryAnimations(
          items,
          recoverySteps.length - 1,
          recoverySteps,
          isPlaying,
        )

        const extraIndex =
          currentIndex - RECOVERY_STEP_INDEX_OFFSET - recoverySteps.length
        addPostRecoveryMessages(items, extraIndex, mockTimelineItems)
      }
    }
  }
}

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
