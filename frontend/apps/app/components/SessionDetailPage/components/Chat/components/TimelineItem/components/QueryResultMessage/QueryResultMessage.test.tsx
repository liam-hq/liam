/**
 * @vitest-environment happy-dom
 */

import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryResultMessage } from './QueryResultMessage'

describe('QueryResultMessage', () => {
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

  const mockResults: SqlResult[] = [mockSuccessResult, mockErrorResult]

  it('renders loading state when results are not provided', () => {
    render(<QueryResultMessage queryResultId="test-id" />)
    expect(screen.getByText('Loading query results...')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading query results')).toBeDisabled()
  })

  it('renders query results summary when collapsed', () => {
    render(<QueryResultMessage queryResultId="test-id" results={mockResults} />)

    expect(screen.getByText('Query Results (2)')).toBeInTheDocument()
    expect(screen.getByText('1 succeeded, 1 failed')).toBeInTheDocument()
    expect(screen.queryByText(mockSuccessResult.sql)).not.toBeInTheDocument()
  })

  it('expands and collapses when header is clicked', async () => {
    const user = userEvent.setup()
    render(<QueryResultMessage queryResultId="test-id" results={mockResults} />)

    const button = screen.getByRole('button', { name: /expand query results/i })

    // Initially collapsed
    expect(screen.queryByText(mockSuccessResult.sql)).not.toBeInTheDocument()

    // Click to expand
    await user.click(button)
    // The SQL is truncated in the preview, so we check for the truncated version
    expect(
      screen.getByText('CREATE TABLE users (id INT PRIMARY KEY, name VARCH...'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('DROP TABLE non_existent_table'),
    ).toBeInTheDocument()

    // Click to collapse
    await user.click(button)
    expect(screen.queryByText(mockSuccessResult.sql)).not.toBeInTheDocument()
  })

  it('displays success and error results with proper styling', async () => {
    const user = userEvent.setup()
    render(<QueryResultMessage queryResultId="test-id" results={mockResults} />)

    await user.click(
      screen.getByRole('button', { name: /expand query results/i }),
    )

    // Check for success indicator
    expect(screen.getByText('✅')).toBeInTheDocument()
    expect(screen.getByText('Success')).toBeInTheDocument()

    // Check for error indicator
    expect(screen.getByText('❌')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('shows empty state when results array is empty', () => {
    render(<QueryResultMessage queryResultId="test-id" results={[]} />)

    expect(screen.getByText('Query Results (0)')).toBeInTheDocument()
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('renders View button when onView callback is provided', () => {
    const onViewMock = vi.fn()
    render(
      <QueryResultMessage
        queryResultId="test-id"
        results={mockResults}
        onView={onViewMock}
      />,
    )

    const viewButton = screen.getByRole('button', { name: 'View' })
    expect(viewButton).toBeInTheDocument()
  })

  it('calls onView when View button is clicked', async () => {
    const user = userEvent.setup()
    const onViewMock = vi.fn()
    render(
      <QueryResultMessage
        queryResultId="test-id"
        results={mockResults}
        onView={onViewMock}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'View' }))
    expect(onViewMock).toHaveBeenCalledTimes(1)
  })

  it('displays individual query result details when expanded', async () => {
    const user = userEvent.setup()
    render(<QueryResultMessage queryResultId="test-id" results={mockResults} />)

    // First expand the main container
    await user.click(
      screen.getByRole('button', { name: /expand query results/i }),
    )

    // Then expand the individual query result to see metadata
    const successButton = screen.getByRole('button', {
      name: /successful query details open/i,
    })
    await user.click(successButton)

    // Check for metadata display
    expect(screen.getByText('Execution time: 123ms')).toBeInTheDocument()
    expect(screen.getByText('Affected rows: 0')).toBeInTheDocument()
    expect(
      screen.getByText('Execution timestamp: 2024-01-01T00:00:00Z'),
    ).toBeInTheDocument()
  })

  it('handles long SQL queries with truncation in preview', () => {
    const longSqlResult: SqlResult = {
      ...mockSuccessResult,
      sql: 'CREATE TABLE very_long_table_name_that_exceeds_fifty_characters_limit_for_preview (id INT PRIMARY KEY)',
    }

    render(
      <QueryResultMessage queryResultId="test-id" results={[longSqlResult]} />,
    )

    // In collapsed state, SQL should be truncated in the summary
    expect(screen.queryByText(longSqlResult.sql)).not.toBeInTheDocument()
  })

  it('applies proper accessibility attributes', () => {
    render(<QueryResultMessage queryResultId="test-id" results={mockResults} />)

    const button = screen.getByRole('button', { name: /expand query results/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('id', 'query-result-header-test-id')
  })
})
