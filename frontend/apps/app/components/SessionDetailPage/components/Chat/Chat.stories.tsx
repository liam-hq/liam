import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, useMemo, useState } from 'react'
import type { TimelineItemEntry } from '../../types'
import { Chat } from './Chat'
import { AnimationControls } from './components/AnimationControls'
import { ANIMATION_THRESHOLDS } from './constants/animationConstants'
import { useAnimationState } from './hooks/useAnimationState'
import { getAnimationDelays } from './utils/animationUtils'
import {
  type AgentStep,
  createDynamicTimelineItems,
  type RecoveryStep,
} from './utils/timelineUtils'

export const meta = {
  component: Chat,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Chat>

type Story = StoryObj<typeof meta>

// Mock timeline items showing agent progress
const mockTimelineItems: TimelineItemEntry[] = [
  {
    id: 'timeline-1',
    type: 'user',
    content:
      'I want to design a database for a greenhouse monitoring system for a strawberry farm',
    timestamp: new Date('2025-07-14T06:39:00Z'),
  },
  {
    id: 'timeline-pm-agent-1',
    type: 'assistant_pm',
    content: `📊 Requirements Analysis
✓ Analyzing requirements...
✓ Organizing business and functional requirements...
✓ Requirements analysis completed`,
    timestamp: new Date('2025-07-14T06:39:10Z'),
  },
  {
    id: 'timeline-db-agent-1',
    type: 'assistant_db',
    content: `🏗️ Schema Design
✓ Designing database schema...
✓ Analyzing table structure and relationships...
✓ Applying schema changes...`,
    timestamp: new Date('2025-07-14T06:39:15Z'),
  },
  {
    id: 'timeline-version-1',
    type: 'schema_version',
    content: 'Version 1',
    buildingSchemaVersionId: 'version-1',
    timestamp: new Date('2025-07-14T06:39:20Z'),
  },
  {
    id: 'timeline-results-1',
    type: 'assistant',
    content: `✓ Applied 7 schema changes successfully  
✓ Schema design completed`,
    timestamp: new Date('2025-07-14T06:39:25Z'),
  },
  {
    id: 'timeline-qa-agent-1',
    type: 'assistant_db',
    content: `💾 Database Creation
✓ Creating database...
✓ Generated DDL statements (7 tables)
✗ Executing DDL statements...`,
    timestamp: new Date('2025-07-14T06:39:30Z'),
  },
  {
    id: 'timeline-error-1',
    type: 'error',
    content: 'Error occurred during DDL execution',
    timestamp: new Date('2025-07-14T06:39:35Z'),
  },
  {
    id: 'timeline-db-agent-2',
    type: 'assistant_db',
    content: `🔧 Error Recovery
✓ Redesigning schema to fix errors...
✓ Generating use cases...
✓ Designing database schema...
✓ Analyzing test cases and queries...
✓ Redesigning schema to fix DDL execution errors...
✓ Analyzing table structure and relationships...
✓ Applying schema changes...
✓ Designing database schema...
✓ Redesigning schema to fix DDL execution errors...
✓ Analyzing table structure and relationships...`,
    timestamp: new Date('2025-07-14T06:39:40Z'),
  },
  {
    id: 'timeline-error-2',
    type: 'error',
    content: 'Error occurred during use case generation',
    timestamp: new Date('2025-07-14T06:39:45Z'),
  },
  {
    id: 'timeline-db-agent-3',
    type: 'assistant_db',
    content: `📋 Final Processing
✓ Applying schema changes...
✓ Preparing final deliverables...
✓ Generating final response...`,
    timestamp: new Date('2025-07-14T06:39:50Z'),
  },
  {
    id: 'timeline-assistant-error-1',
    type: 'error',
    content: `Error Details  
Sorry, an error occurred during processing: Cannot perform an add operation at the desired path name: OPERATION_PATH_CANNOT_ADD index: 0 operation: { "op": "add", "path": "/tables/greenhouses/constraints/greenhouses_pkey", "value": { "type": "PRIMARY KEY", "name": "greenhouses_pkey", "columnNames": [ "id" ] } } tree: { "tables": {} }`,
    timestamp: new Date('2025-07-14T06:39:55Z'),
  },
  {
    id: 'timeline-user-2',
    type: 'user',
    content: 'Please retry',
    timestamp: new Date('2025-07-14T06:40:00Z'),
  },
  {
    id: 'timeline-pm-agent-2',
    type: 'assistant_pm',
    content: `📊 Requirements Analysis
✓ Analyzing requirements...
✓ Organizing business and functional requirements...
✓ Requirements analysis completed`,
    timestamp: new Date('2025-07-14T06:40:05Z'),
  },
  {
    id: 'timeline-db-agent-4',
    type: 'assistant_db',
    content: `🏗️ Schema Design
✓ Designing database schema...
✓ Analyzing table structure and relationships...
✓ Applying schema changes...
✗ Schema update failed
✓ Schema design completed`,
    timestamp: new Date('2025-07-14T06:40:10Z'),
  },
  {
    id: 'timeline-qa-agent-2',
    type: 'assistant_db',
    content: `📦 Final Steps
✓ Preparing final deliverables...
✓ Saving artifacts...
✓ Artifacts saved successfully
✓ Generating final response...`,
    timestamp: new Date('2025-07-14T06:40:15Z'),
  },
  {
    id: 'timeline-assistant-error-2',
    type: 'error',
    content:
      'Version conflict: The schema has been modified since you last loaded it',
    timestamp: new Date('2025-07-14T06:40:20Z'),
  },
]

// Mock version data for VersionMessage
const mockVersionData = {
  'version-1': {
    id: 'version-1',
    number: 1,
    patch: [
      {
        op: 'add',
        path: '/tables/greenhouses',
        value: { name: 'greenhouses' },
      },
      { op: 'add', path: '/tables/sensors', value: { name: 'sensors' } },
      {
        op: 'add',
        path: '/tables/sensor_data',
        value: { name: 'sensor_data' },
      },
      {
        op: 'add',
        path: '/tables/greenhouses/columns/id',
        value: { name: 'id', type: 'bigint' },
      },
      {
        op: 'add',
        path: '/tables/sensors/columns/id',
        value: { name: 'id', type: 'bigint' },
      },
      {
        op: 'add',
        path: '/tables/sensor_data/columns/id',
        value: { name: 'id', type: 'bigint' },
      },
      {
        op: 'add',
        path: '/tables/greenhouses/constraints/greenhouses_pkey',
        value: { type: 'PRIMARY KEY', columnNames: ['id'] },
      },
    ],
  },
}

// Mock schema based on greenhouse monitoring system
const mockSchemaData = {
  tables: {
    greenhouses: {
      name: 'greenhouses',
      columns: {
        id: {
          name: 'id',
          type: 'bigint',
          default: null,
          check: null,
          notNull: true,
          comment: 'Primary key',
        },
        name: {
          name: 'name',
          type: 'text',
          default: null,
          check: null,
          notNull: true,
          comment: 'Greenhouse name',
        },
        location: {
          name: 'location',
          type: 'text',
          default: null,
          check: null,
          notNull: false,
          comment: 'Location of greenhouse',
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp',
          default: 'now()',
          check: null,
          notNull: true,
          comment: 'Creation timestamp',
        },
      },
      comment: 'Greenhouses table',
      indexes: {},
      constraints: {
        greenhouses_pkey: {
          name: 'greenhouses_pkey',
          type: 'PRIMARY KEY' as const,
          columnNames: ['id'],
        },
      },
    },
    sensors: {
      name: 'sensors',
      columns: {
        id: {
          name: 'id',
          type: 'bigint',
          default: null,
          check: null,
          notNull: true,
          comment: 'Primary key',
        },
        greenhouse_id: {
          name: 'greenhouse_id',
          type: 'bigint',
          default: null,
          check: null,
          notNull: true,
          comment: 'Reference to greenhouse',
        },
        type: {
          name: 'type',
          type: 'text',
          default: null,
          check: null,
          notNull: true,
          comment: 'Sensor type',
        },
        status: {
          name: 'status',
          type: 'text',
          default: 'active',
          check: null,
          notNull: true,
          comment: 'Sensor status',
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp',
          default: 'now()',
          check: null,
          notNull: true,
          comment: 'Creation timestamp',
        },
      },
      comment: 'Sensors table',
      indexes: {},
      constraints: {
        sensors_pkey: {
          name: 'sensors_pkey',
          type: 'PRIMARY KEY' as const,
          columnNames: ['id'],
        },
        sensors_greenhouse_id_fkey: {
          name: 'sensors_greenhouse_id_fkey',
          type: 'FOREIGN KEY' as const,
          columnNames: ['greenhouse_id'],
          targetTableName: 'greenhouses',
          targetColumnNames: ['id'],
          updateConstraint: 'CASCADE' as const,
          deleteConstraint: 'CASCADE' as const,
        },
      },
    },
  },
}

const InteractiveDemo = () => {
  const [timelineItemsState, setTimelineItemsState] =
    useState<TimelineItemEntry[]>(mockTimelineItems)

  const agentSteps: AgentStep[] = useMemo(
    () => [
      { agent: 'pm', task: 'Analyzing requirements' },
      { agent: 'pm', task: 'Organizing business and functional requirements' },
      { agent: 'pm', task: 'Requirements analysis completed' },
      { agent: 'db', task: 'Designing database schema' },
      { agent: 'db', task: 'Analyzing table structure and relationships' },
      { agent: 'db', task: 'Applying schema changes' },
      { agent: 'db', task: 'Creating database' },
      { agent: 'db', task: 'Generated DDL statements (7 tables)' },
      { agent: 'db', task: 'Executing DDL statements', willFail: true },
    ],
    [],
  )

  const recoverySteps: RecoveryStep[] = useMemo(
    () => [
      {
        agent: 'db',
        task: 'Redesigning schema to fix errors',
        type: 'error-recovery',
      },
      { agent: 'db', task: 'Generating use cases', type: 'error-recovery' },
      {
        agent: 'db',
        task: 'Designing database schema',
        type: 'error-recovery',
      },
      {
        agent: 'db',
        task: 'Analyzing test cases and queries',
        type: 'error-recovery',
      },
      {
        agent: 'db',
        task: 'Redesigning schema to fix DDL execution errors',
        type: 'error-recovery',
      },
      {
        agent: 'db',
        task: 'Analyzing table structure and relationships',
        type: 'error-recovery',
      },
      { agent: 'db', task: 'Applying schema changes', type: 'error-recovery' },
      {
        agent: 'db',
        task: 'Designing database schema',
        type: 'error-recovery',
      },
      {
        agent: 'db',
        task: 'Redesigning schema to fix DDL execution errors',
        type: 'error-recovery',
      },
      {
        agent: 'db',
        task: 'Analyzing table structure and relationships',
        type: 'error-recovery',
      },
      {
        agent: 'db',
        task: 'Applying schema changes',
        type: 'final-processing',
      },
      {
        agent: 'db',
        task: 'Preparing final deliverables',
        type: 'final-processing',
      },
      {
        agent: 'db',
        task: 'Generating final response',
        type: 'final-processing',
      },
      { agent: 'pm', task: 'Analyzing requirements', type: 'pm-2' },
      {
        agent: 'pm',
        task: 'Organizing business and functional requirements',
        type: 'pm-2',
      },
      { agent: 'pm', task: 'Requirements analysis completed', type: 'pm-2' },
      { agent: 'db', task: 'Designing database schema', type: 'db-4' },
      {
        agent: 'db',
        task: 'Analyzing table structure and relationships',
        type: 'db-4',
      },
      { agent: 'db', task: 'Applying schema changes', type: 'db-4' },
      {
        agent: 'db',
        task: 'Schema update failed',
        type: 'db-4',
        willFail: true,
      },
      { agent: 'db', task: 'Schema design completed', type: 'db-4' },
      { agent: 'qa', task: 'Preparing final deliverables', type: 'qa-2' },
      { agent: 'qa', task: 'Saving artifacts', type: 'qa-2' },
      { agent: 'qa', task: 'Artifacts saved successfully', type: 'qa-2' },
      { agent: 'qa', task: 'Generating final response', type: 'qa-2' },
    ],
    [],
  )

  const animation = useAnimationState(agentSteps.length)

  const timelineItems = createDynamicTimelineItems(
    animation.currentStep,
    animation.currentIndex,
    agentSteps,
    recoverySteps,
    timelineItemsState,
    animation.isPlaying,
  )

  // Handle agent step animation
  useEffect(() => {
    if (!animation.isPlaying || animation.currentStep >= agentSteps.length)
      return

    const currentStepData = agentSteps[animation.currentStep - 1]
    const hasHourglassTask = currentStepData && !currentStepData.willFail
    const animationDelays = getAnimationDelays()

    const delay =
      hasHourglassTask && animation.currentStep < agentSteps.length
        ? animationDelays.HOURGLASS_TASK
        : animationDelays.NORMAL_TASK

    const timer = setTimeout(() => {
      animation.setCurrentStep((prev) => prev + 1)
    }, delay)

    return () => clearTimeout(timer)
  }, [animation.isPlaying, animation.currentStep, agentSteps])

  const getAnimationDelay = (index: number) => {
    const animationDelays = getAnimationDelays()
    if (
      index >= ANIMATION_THRESHOLDS.RECOVERY_START_INDEX &&
      index < timelineItemsState.length + recoverySteps.length
    ) {
      const recoveryStepIndex =
        index - ANIMATION_THRESHOLDS.RECOVERY_START_INDEX
      const currentRecoveryStep = recoverySteps[recoveryStepIndex]
      const isHourglassStep =
        currentRecoveryStep && !currentRecoveryStep.willFail
      return isHourglassStep
        ? animationDelays.HOURGLASS_TASK
        : index - ANIMATION_THRESHOLDS.RECOVERY_START_INDEX <
            recoverySteps.length
          ? animationDelays.NORMAL_TASK
          : animationDelays.QUICK_TASK
    }
    return animationDelays.NORMAL_TASK
  }

  // Handle error display and recovery animation
  useEffect(() => {
    if (!animation.isPlaying) return

    if (
      animation.currentStep >= agentSteps.length &&
      animation.currentIndex === 0
    ) {
      animation.setCurrentIndex(1)
      animation.setIsPlaying(false)
      return
    }

    if (
      animation.currentIndex >= ANIMATION_THRESHOLDS.RECOVERY_START_INDEX &&
      animation.currentIndex < timelineItemsState.length + recoverySteps.length
    ) {
      const delay = getAnimationDelay(animation.currentIndex)

      const timer = setTimeout(() => {
        animation.setCurrentIndex((prev) => prev + 1)
      }, delay)
      return () => clearTimeout(timer)
    }

    if (
      animation.currentIndex >=
      timelineItemsState.length + recoverySteps.length
    ) {
      animation.setIsPlaying(false)
    }
  }, [
    animation.isPlaying,
    animation.currentStep,
    animation.currentIndex,
    recoverySteps.length,
    timelineItemsState.length,
  ])

  const handleMessageSend = (entry: TimelineItemEntry) => {
    setTimelineItemsState((prev) => [...prev, entry])
    if (
      !animation.isPlaying &&
      animation.currentIndex === timelineItemsState.length
    ) {
      animation.setCurrentIndex((prev) => prev + 1)
    }
  }

  return (
    <div>
      <AnimationControls
        state={animation}
        actions={animation}
        agentStepsLength={agentSteps.length}
        mockTimelineItemsLength={timelineItemsState.length}
      />
      <Chat
        timelineItems={timelineItems}
        schemaData={mockSchemaData}
        designSessionId="design-session-1"
        onMessageSend={handleMessageSend}
        onRetry={animation.handleRetry}
        mockVersionData={mockVersionData['version-1']}
      />
    </div>
  )
}

export const Default: Story = {
  args: {
    timelineItems: [],
    schemaData: mockSchemaData,
    designSessionId: 'design-session-1',
    onMessageSend: () => {},
    onRetry: () => {},
    mockVersionData: mockVersionData['version-1'],
  },
  render: () => <InteractiveDemo />,
}
