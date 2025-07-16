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
  isPlaying: boolean,
  mockTimelineItems: TimelineItemEntry[],
): void => {
  if (currentStep <= 3) {
    items.push({
      id: 'timeline-pm-progress',
      type: 'assistant_pm',
      content: generateAgentContent('pm', currentStep, agentSteps, isPlaying),
      timestamp: TIMELINE_TIMESTAMPS.PM_PROGRESS,
    })
  } else {
    items.push(mockTimelineItems[1])
  }
}

const addDBAgentProgress = (
  items: TimelineItemEntry[],
  currentStep: number,
  agentSteps: AgentStep[],
  isPlaying: boolean,
  mockTimelineItems: TimelineItemEntry[],
): void => {
  if (currentStep >= 4 && currentStep <= 6) {
    items.push({
      id: 'timeline-db-schema-progress',
      type: 'assistant_db',
      content: generateAgentContent('db', currentStep, agentSteps, isPlaying),
      timestamp: TIMELINE_TIMESTAMPS.DB_SCHEMA_PROGRESS,
    })
  }

  if (currentStep >= 7 && currentStep <= 9) {
    items.push(mockTimelineItems[2])

    items.push({
      id: 'timeline-db-creation-progress',
      type: 'assistant_db',
      content: generateAgentContent('db', currentStep, agentSteps, isPlaying),
      timestamp: TIMELINE_TIMESTAMPS.DB_CREATION_PROGRESS,
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
  let timestamp = TIMELINE_TIMESTAMPS.ERROR_RECOVERY

  if (currentStep.type === 'pm-2') {
    assistantType = 'assistant_pm'
    timestamp = TIMELINE_TIMESTAMPS.PM_RECOVERY
  } else if (currentStep.type === 'db-4') {
    assistantType = 'assistant_db'
    timestamp = TIMELINE_TIMESTAMPS.DB_RECOVERY
  } else if (currentStep.type === 'qa-2') {
    assistantType = 'assistant_qa'
    timestamp = TIMELINE_TIMESTAMPS.QA_RECOVERY
  }

  items.push({
    id: `timeline-${currentStep.type}-progress`,
    type: assistantType,
    content,
    timestamp,
  })
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
    items.push(mockTimelineItems[5])
  }

  addInitialCompletedMessages(items, mockTimelineItems)

  if (currentIndex > 0) {
    items.push(mockTimelineItems[6])

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
  recoverySteps: RecoveryStep[],
  mockTimelineItems: TimelineItemEntry[],
  isPlaying: boolean,
): TimelineItemEntry[] => {
  const items: TimelineItemEntry[] = []

  items.push(mockTimelineItems[0])

  if (currentStep > 0) {
    addPMAgentProgress(
      items,
      currentStep,
      agentSteps,
      isPlaying,
      mockTimelineItems,
    )

    if (currentStep > 3) {
      addDBAgentProgress(
        items,
        currentStep,
        agentSteps,
        isPlaying,
        mockTimelineItems,
      )
    }
  }

  if (currentStep >= agentSteps.length) {
    addPostAgentStepsMessages(
      items,
      currentStep,
      currentIndex,
      agentSteps,
      recoverySteps,
      mockTimelineItems,
      isPlaying,
    )
  }

  return items
}
