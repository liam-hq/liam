import type { StateSnapshot } from '@langchain/langgraph'
import type { CheckpointSaverTestInitializer } from '@langchain/langgraph-checkpoint-validation'
import { validate } from '@langchain/langgraph-checkpoint-validation'
import { createClient } from '@liam-hq/db'
import { describe, expect, it } from 'vitest'
import { SupabaseCheckpointSaver } from './SupabaseCheckpointSaver'

// Test database configuration - use local development environment variables
const SUPABASE_URL =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'http://localhost:54321'
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || ''

const createTestClient = () => createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const clearOrganizationData = async (
  client: ReturnType<typeof createTestClient>,
  organizationId: string,
) => {
  await client
    .from('checkpoint_writes')
    .delete()
    .eq('organization_id', organizationId)

  await client
    .from('checkpoint_blobs')
    .delete()
    .eq('organization_id', organizationId)

  await client
    .from('checkpoints')
    .delete()
    .eq('organization_id', organizationId)
}

const getOrganizationId = async () => {
  const client = createTestClient()
  const { data, error } = await client
    .from('organizations')
    .select('id')
    .eq('name', 'liam-hq')
    .single()

  if (error) {
    throw error
  }

  return data.id
}

const supabaseCheckpointerInitializer: CheckpointSaverTestInitializer<SupabaseCheckpointSaver> =
  {
    checkpointerName: 'SupabaseCheckpointSaver',

    async beforeAll() {
      const client = createTestClient()
      const organizationId = await getOrganizationId()
      await clearOrganizationData(client, organizationId)
    },

    async afterAll() {},

    async createCheckpointer() {
      const organizationId = await getOrganizationId()
      const client = createTestClient()
      await clearOrganizationData(client, organizationId)
      return new SupabaseCheckpointSaver({
        client,
        options: { organizationId },
      })
    },

    async destroyCheckpointer(_checkpointer: SupabaseCheckpointSaver) {},
  }

// LangGraph Official Validation Tests
describe('LangGraph Official Validation', () => {
  validate(supabaseCheckpointerInitializer)
})

// Checkpoint next and tasks validation
describe('Checkpoint next and tasks validation', () => {
  it('should correctly save next nodes and pending tasks in checkpoints', async () => {
    const { Annotation, END, START, StateGraph } = await import(
      '@langchain/langgraph'
    )

    // Define state
    const State = Annotation.Root({
      foo: Annotation<string>,
      bar: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
      }),
    })

    // Build graph
    const workflow = new StateGraph(State)
      .addNode('nodeA', () => ({ foo: 'a', bar: ['a'] }))
      .addNode('nodeB', () => ({ foo: 'b', bar: ['b'] }))
      .addEdge(START, 'nodeA')
      .addEdge('nodeA', 'nodeB')
      .addEdge('nodeB', END)

    // Create checkpointer
    const organizationId = await getOrganizationId()
    const client = createTestClient()
    await clearOrganizationData(client, organizationId)
    const checkpointer = new SupabaseCheckpointSaver({
      client,
      options: { organizationId },
    })

    const graph = workflow.compile({ checkpointer })

    // Execute graph
    const config = { configurable: { thread_id: 'test-next-tasks-thread' } }
    await graph.invoke({ foo: '' }, config)

    // Collect history
    const history: StateSnapshot[] = []
    for await (const snapshot of graph.getStateHistory(config)) {
      history.push(snapshot)
    }

    const normalizeTasks = (tasks: StateSnapshot['tasks']) =>
      tasks.map((task) => {
        const { id: _id, ...rest } = task
        return rest
      })

    const expectTasks = (
      snapshot: StateSnapshot,
      expected: Array<Record<string, unknown> | string>,
    ) => {
      expect(snapshot.tasks).toHaveLength(expected.length)
      expect(normalizeTasks(snapshot.tasks)).toEqual(expected)
    }

    expect(history).toHaveLength(4)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const [finalState, afterNodeAState, initialState, startState] = history as [
      StateSnapshot,
      StateSnapshot,
      StateSnapshot,
      StateSnapshot,
    ]

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const finalValues = finalState.values as typeof State.State
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const afterNodeAValues = afterNodeAState.values as typeof State.State
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const initialValues = initialState.values as typeof State.State

    // Step 2: Final state (nodeB completed)
    expect(finalState.metadata?.step).toBe(2)
    expect(finalValues.foo).toBe('b')
    expect(finalValues.bar).toEqual(['a', 'b'])
    expect(finalState.next).toEqual([])
    expect(finalState.tasks).toHaveLength(0)

    // Step 1: nodeA completed; Supabase snapshots expose the queued task via tasks
    expect(afterNodeAState.metadata?.step).toBe(1)
    expect(afterNodeAValues.foo).toBe('a')
    expect(afterNodeAValues.bar).toEqual(['a'])
    expect(afterNodeAState.next).toEqual(['nodeB'])
    expectTasks(afterNodeAState, [
      {
        name: 'nodeB',
        path: ['__pregel_pull', 'nodeB'],
        interrupts: [],
        result: { foo: 'b', bar: ['b'] },
      },
    ])

    // Step 0: Initial input
    expect(initialState.metadata?.step).toBe(0)
    expect(initialValues.foo).toBe('')
    expect(initialValues.bar).toEqual([])
    expect(initialState.next).toEqual(['nodeA'])
    expectTasks(initialState, [
      {
        name: 'nodeA',
        path: ['__pregel_pull', 'nodeA'],
        interrupts: [],
        result: { foo: 'a', bar: ['a'] },
      },
    ])

    // Step -1: Graph start
    expect(startState.metadata?.step).toBe(-1)
    expect(startState.next).toEqual(['__start__'])
    expectTasks(startState, [
      {
        name: '__start__',
        path: ['__pregel_pull', '__start__'],
        interrupts: [],
        result: { foo: '' },
      },
    ])
  })
})
