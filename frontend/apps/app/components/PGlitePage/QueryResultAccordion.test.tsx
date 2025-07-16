import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { QueryResultAccordion } from './QueryResultAccordion'
import type { SqlResult } from './utils'

describe('QueryResultAccordion', () => {
  const mockSuccessResult: SqlResult = {
    id: '1',
    sql: 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));',
    success: true,
    result: 'CREATE TABLE',
    metadata: {
      executionTime: 25,
      timestamp: '2024-01-16T10:00:00.000Z',
      affectedRows: 0,
    },
  }

  const mockErrorResult: SqlResult = {
    id: '2',
    sql: 'INVALID SQL STATEMENT;',
    success: false,
    result: 'syntax error at or near "INVALID"',
    metadata: {
      executionTime: 5,
      timestamp: '2024-01-16T10:01:00.000Z',
    },
  }

  it('should display query and result sections', () => {
    render(<QueryResultAccordion result={mockSuccessResult} />)

    expect(screen.getByText('Query')).toBeInTheDocument()
    expect(screen.getByText('Result')).toBeInTheDocument()
  })

  it('should display success status', () => {
    render(<QueryResultAccordion result={mockSuccessResult} />)

    const statusElement = screen.getByText('Success')
    expect(statusElement).toBeInTheDocument()
  })

  it('should display error status', () => {
    render(<QueryResultAccordion result={mockErrorResult} />)

    const statusElement = screen.getByText('Failed')
    expect(statusElement).toBeInTheDocument()
  })

  it('should toggle query section on click', async () => {
    const user = userEvent.setup()
    render(<QueryResultAccordion result={mockSuccessResult} />)

    const queryButton = screen.getByRole('button', { name: /toggle query/i })

    // Initially collapsed
    expect(screen.queryByText(mockSuccessResult.sql)).not.toBeInTheDocument()

    // Click to expand
    await user.click(queryButton)
    expect(screen.getByText(mockSuccessResult.sql)).toBeInTheDocument()

    // Click to collapse
    await user.click(queryButton)
    expect(screen.queryByText(mockSuccessResult.sql)).not.toBeInTheDocument()
  })

  it('should toggle result section on click', async () => {
    const user = userEvent.setup()
    render(<QueryResultAccordion result={mockSuccessResult} />)

    const resultButton = screen.getByRole('button', { name: /toggle result/i })

    // Initially collapsed
    expect(screen.queryByText('"CREATE TABLE"')).not.toBeInTheDocument()

    // Click to expand
    await user.click(resultButton)
    expect(screen.getByText('"CREATE TABLE"')).toBeInTheDocument()

    // Click to collapse
    await user.click(resultButton)
    expect(screen.queryByText('"CREATE TABLE"')).not.toBeInTheDocument()
  })

  it('should display metadata when result is expanded', async () => {
    const user = userEvent.setup()
    render(<QueryResultAccordion result={mockSuccessResult} />)

    const resultButton = screen.getByRole('button', { name: /toggle result/i })
    await user.click(resultButton)

    expect(screen.getByText('Execution time: 25ms')).toBeInTheDocument()
    expect(screen.getByText('Affected rows: 0')).toBeInTheDocument()
    expect(screen.getByText(/2024-01-16T10:00:00.000Z/)).toBeInTheDocument()
  })

  it('should show appropriate icons for collapsed/expanded state', async () => {
    const user = userEvent.setup()
    render(<QueryResultAccordion result={mockSuccessResult} />)

    const queryButton = screen.getByRole('button', { name: /toggle query/i })

    // Initially collapsed (right arrow)
    expect(queryButton).toHaveTextContent('▶')

    // Click to expand (down arrow)
    await user.click(queryButton)
    expect(queryButton).toHaveTextContent('▼')
  })
})
