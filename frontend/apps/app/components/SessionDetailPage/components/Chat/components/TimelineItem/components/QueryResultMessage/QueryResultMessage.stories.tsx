import type { SqlResult } from '@liam-hq/pglite-server'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { QueryResultMessage } from './QueryResultMessage'

const meta = {
  component: QueryResultMessage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof QueryResultMessage>

export default meta
type Story = StoryObj<typeof meta>

const mockSuccessResult: SqlResult = {
  id: '1',
  sql: 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100))',
  success: true,
  result: { command: 'CREATE', rowCount: 0 },
  metadata: {
    executionTime: 123,
    timestamp: '2024-01-01T00:00:00Z',
    affectedRows: 0,
  },
}

const mockErrorResult: SqlResult = {
  id: '2',
  sql: 'DROP TABLE non_existent_table',
  success: false,
  result: { error: 'Table does not exist' },
  metadata: {
    executionTime: 45,
    timestamp: '2024-01-01T00:01:00Z',
  },
}

const mockSelectResult: SqlResult = {
  id: '3',
  sql: 'SELECT * FROM users LIMIT 10',
  success: true,
  result: {
    command: 'SELECT',
    rowCount: 10,
    rows: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ],
  },
  metadata: {
    executionTime: 89,
    timestamp: '2024-01-01T00:02:00Z',
    affectedRows: 10,
  },
}

const mockLongSqlResult: SqlResult = {
  id: '4',
  sql: 'CREATE TABLE very_long_table_name_that_exceeds_fifty_characters_limit_for_preview_display_in_the_component (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
  success: true,
  result: { command: 'CREATE', rowCount: 0 },
  metadata: {
    executionTime: 156,
    timestamp: '2024-01-01T00:03:00Z',
    affectedRows: 0,
  },
}

export const Loading: Story = {
  args: {
    queryResultId: 'test-id',
  },
}

export const Empty: Story = {
  args: {
    queryResultId: 'test-id',
    results: [],
  },
}

export const SingleSuccess: Story = {
  args: {
    queryResultId: 'test-id',
    results: [mockSuccessResult],
  },
}

export const SingleError: Story = {
  args: {
    queryResultId: 'test-id',
    results: [mockErrorResult],
  },
}

export const Mixed: Story = {
  args: {
    queryResultId: 'test-id',
    results: [mockSuccessResult, mockErrorResult],
  },
}

export const MultipleQueries: Story = {
  args: {
    queryResultId: 'test-id',
    results: [
      mockSuccessResult,
      mockSelectResult,
      mockErrorResult,
      mockLongSqlResult,
    ],
  },
}

export const WithViewButton: Story = {
  args: {
    queryResultId: 'test-id',
    results: [mockSuccessResult, mockErrorResult],
    onView: () => {
      // View button click handler
    },
  },
}

export const AllSuccess: Story = {
  args: {
    queryResultId: 'test-id',
    results: [mockSuccessResult, mockSelectResult, mockLongSqlResult],
  },
}

export const AllErrors: Story = {
  args: {
    queryResultId: 'test-id',
    results: [
      mockErrorResult,
      {
        id: '5',
        sql: 'INSERT INTO users VALUES (1, "test") WITHOUT PERMISSION',
        success: false,
        result: { error: 'Permission denied' },
        metadata: {
          executionTime: 12,
          timestamp: '2024-01-01T00:04:00Z',
        },
      },
      {
        id: '6',
        sql: 'UPDATE non_existent_table SET value = 1',
        success: false,
        result: { error: 'Table not found' },
        metadata: {
          executionTime: 8,
          timestamp: '2024-01-01T00:05:00Z',
        },
      },
    ],
  },
}

export const LongQueryList: Story = {
  args: {
    queryResultId: 'test-id',
    results: Array.from({ length: 10 }, (_, i) => ({
      id: `query-${i + 1}`,
      sql: `SELECT * FROM table_${i + 1} WHERE id = ${i + 1}`,
      success: i % 3 !== 0,
      result:
        i % 3 === 0
          ? { error: `Error in query ${i + 1}` }
          : { command: 'SELECT', rowCount: 5 },
      metadata: {
        executionTime: Math.floor(Math.random() * 200) + 50,
        timestamp: new Date(2024, 0, 1, 0, i).toISOString(),
        affectedRows: i % 3 === 0 ? undefined : 5,
      },
    })),
  },
}
