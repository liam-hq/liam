import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DDLInputSection } from './DdlInputSection'
import type { DDLState, SqlResult } from './utils'

vi.mock('./QueryResultAccordion', () => ({
  QueryResultAccordion: ({ result }: { result: SqlResult }) => (
    <div data-testid="query-result-accordion">
      {result.success ? 'Success' : 'Failed'}: {result.sql}
    </div>
  ),
}))

describe('DDLInputSection', () => {
  const mockDdlState: DDLState = {
    ddlInput: '',
    results: [],
  }

  const mockUpdateDdlInput = vi.fn()
  const mockExecuteDDL = vi.fn()

  it('should render DDL input section with title and description', () => {
    render(
      <DDLInputSection
        ddlState={mockDdlState}
        updateDdlInput={mockUpdateDdlInput}
        executeDDL={mockExecuteDDL}
      />,
    )

    expect(screen.getByText('DDL Input Area (Global)')).toBeInTheDocument()
    expect(
      screen.getByText(/When you enter and execute DDL/),
    ).toBeInTheDocument()
  })

  it('should render QueryResultAccordion for each result', () => {
    const stateWithResults: DDLState = {
      ddlInput: '',
      results: [
        {
          id: '1',
          sql: 'CREATE TABLE users',
          success: true,
          result: 'CREATE TABLE',
          metadata: {
            executionTime: 10,
            timestamp: '2024-01-16T10:00:00.000Z',
          },
        },
        {
          id: '2',
          sql: 'INVALID SQL',
          success: false,
          result: 'syntax error',
          metadata: {
            executionTime: 5,
            timestamp: '2024-01-16T10:01:00.000Z',
          },
        },
      ],
    }

    render(
      <DDLInputSection
        ddlState={stateWithResults}
        updateDdlInput={mockUpdateDdlInput}
        executeDDL={mockExecuteDDL}
      />,
    )

    const accordions = screen.getAllByTestId('query-result-accordion')
    expect(accordions).toHaveLength(2)
    expect(accordions[0]).toHaveTextContent('Success: CREATE TABLE users')
    expect(accordions[1]).toHaveTextContent('Failed: INVALID SQL')
  })
})
