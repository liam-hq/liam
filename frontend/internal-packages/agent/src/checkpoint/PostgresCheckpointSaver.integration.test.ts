import type { StateSnapshot } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import {
  type CheckpointSaverTestInitializer,
  validate,
} from '@langchain/langgraph-checkpoint-validation'
import { Pool } from 'pg'
import { describe, expect, it } from 'vitest'

const POSTGRES_CONNECTION_STRING =
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
const POSTGRES_SCHEMA = 'langgraph_checkpoint_tests'

const TABLES_TO_CLEAR = [
  'checkpoint_writes',
  'checkpoint_blobs',
  'checkpoints',
] as const

const createPostgresSaver = () =>
  PostgresSaver.fromConnString(POSTGRES_CONNECTION_STRING, {
    schema: POSTGRES_SCHEMA,
  })

const withAdminPool = async <T>(fn: (pool: Pool) => Promise<T>) => {
  const pool = new Pool({ connectionString: POSTGRES_CONNECTION_STRING })
  return fn(pool).finally(() => pool.end())
}

const clearCheckpointTables = () =>
  withAdminPool(async (pool) => {
    for (const table of TABLES_TO_CLEAR) {
      await pool.query(`DELETE FROM ${POSTGRES_SCHEMA}.${table}`)
    }
  })

const prepareCheckpointer = async () => {
  const checkpointer = createPostgresSaver()
  await checkpointer.setup()
  await clearCheckpointTables()
  return checkpointer
}

const cleanupCheckpointer = async (checkpointer: PostgresSaver) => {
  await clearCheckpointTables()
  await checkpointer.end()
}

const postgresCheckpointerInitializer: CheckpointSaverTestInitializer<PostgresSaver> =
  {
    checkpointerName: '@langchain/langgraph-checkpoint-postgres',
    beforeAllTimeout: 60_000,
    async beforeAll() {
      const checkpointer = await prepareCheckpointer()
      await cleanupCheckpointer(checkpointer)
    },
    async afterAll() {
      const checkpointer = await prepareCheckpointer()
      await cleanupCheckpointer(checkpointer)
    },
    async createCheckpointer() {
      return prepareCheckpointer()
    },
    async destroyCheckpointer(checkpointer: PostgresSaver) {
      await cleanupCheckpointer(checkpointer)
    },
  }

describe('LangGraph Official Validation (Postgres)', () => {
  validate(postgresCheckpointerInitializer)
})

describe('Checkpoint next and tasks validation (Postgres)', () => {
  it('should correctly save next nodes and pending tasks in checkpoints', async () => {
    const { Annotation, END, START, StateGraph } = await import(
      '@langchain/langgraph'
    )

    const State = Annotation.Root({
      foo: Annotation<string>,
      bar: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
      }),
    })

    const workflow = new StateGraph(State)
      .addNode('nodeA', () => ({ foo: 'a', bar: ['a'] }))
      .addNode('nodeB', () => ({ foo: 'b', bar: ['b'] }))
      .addEdge(START, 'nodeA')
      .addEdge('nodeA', 'nodeB')
      .addEdge('nodeB', END)

    const checkpointer = await prepareCheckpointer()

    const graph = workflow.compile({ checkpointer })

    const config = { configurable: { thread_id: 'test-next-tasks-thread' } }
    await graph.invoke({ foo: '' }, config)

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

    expect(finalState.metadata?.step).toBe(2)
    expect(finalValues.foo).toBe('b')
    expect(finalValues.bar).toEqual(['a', 'b'])
    expect(finalState.next).toEqual([])
    expect(finalState.tasks).toHaveLength(0)

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

    await cleanupCheckpointer(checkpointer)
  })
})
