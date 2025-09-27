import { aColumn, aPrimaryKeyConstraint } from '@liam-hq/schema'
import { render, screen } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { FC, PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
import {
  SchemaProvider,
  UserEditingProvider,
} from '../../../../../../../../../stores'
import { ColumnsItem } from './ColumnsItem'

const wrapper: FC<PropsWithChildren> = ({ children }) => (
  <NuqsTestingAdapter>
    <SchemaProvider current={{ enums: {}, extensions: {}, tables: {} }}>
      <UserEditingProvider>{children}</UserEditingProvider>
    </SchemaProvider>
  </NuqsTestingAdapter>
)

describe('id', () => {
  it('renders column name as a linked heading', () => {
    render(
      <ColumnsItem
        tableId="users"
        column={aColumn({ name: 'id', type: 'bigserial' })}
        constraints={{}}
        focusedElementId={'users__columns__created_at'}
      />,
      { wrapper },
    )

    expect(
      screen.getByRole('heading', { name: 'id', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'id' })).toHaveAttribute(
      'href',
      '#users__columns__id',
    )
  })
})

describe('type', () => {
  it('renders column type', () => {
    render(
      <ColumnsItem
        tableId="users"
        column={aColumn({ name: 'id', type: 'bigserial' })}
        constraints={{}}
        focusedElementId={'users__columns__created_at'}
      />,
      { wrapper },
    )

    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('bigserial')).toBeInTheDocument()
  })
})

describe('default value', () => {
  it('does not render default value if default is null', () => {
    render(
      <ColumnsItem
        tableId="users"
        column={aColumn({ default: null })}
        constraints={{}}
        focusedElementId={'users__columns__created_at'}
      />,
      { wrapper },
    )

    expect(screen.queryByText('Default')).not.toBeInTheDocument()
  })

  it('renders the default value when provided', () => {
    render(
      <ColumnsItem
        tableId="users"
        column={aColumn({ default: 100 })}
        constraints={{}}
        focusedElementId={'users__columns__created_at'}
      />,
      { wrapper },
    )

    expect(screen.getByText('Default')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })
})

describe('primary key constraint', () => {
  it('renders a "Primary Key" indicator', () => {
    render(
      <ColumnsItem
        tableId="users"
        column={aColumn({ name: 'id' })}
        constraints={{
          idPrimary: aPrimaryKeyConstraint({
            name: 'idPrimary',
            columnNames: ['id'],
          }),
        }}
        focusedElementId={'users__columns__created_at'}
      />,
      { wrapper },
    )

    expect(screen.getByText('Primary Key')).toBeInTheDocument()
  })
})

describe('not null', () => {
  it('renders a "Not-null" indicator when a column is non-null', () => {
    render(
      <ColumnsItem
        tableId="users"
        column={aColumn({ name: 'id', notNull: true })}
        constraints={{}}
        focusedElementId={'users__columns__created_at'}
      />,
      { wrapper },
    )

    expect(screen.getByText('Not-null')).toBeInTheDocument()
  })

  it('renders a "Nullable" indicator when a column is non-null', () => {
    render(
      <ColumnsItem
        tableId="users"
        column={aColumn({ name: 'id', notNull: false })}
        constraints={{}}
        focusedElementId={'users__columns__created_at'}
      />,
      { wrapper },
    )

    expect(screen.getByText('Nullable')).toBeInTheDocument()
  })
})

describe('blink circle indicator', () => {
  it('renders a blink circle indicator when the "focusedElementId" is same with its element id', () => {
    render(
      <ColumnsItem
        tableId="users"
        column={aColumn({ name: 'id', type: 'bigserial' })}
        constraints={{}}
        focusedElementId={'users__columns__id'}
      />,
      { wrapper },
    )

    expect(screen.getByTestId('blink-circle-indicator')).toBeInTheDocument()
  })

  it('does not render a blink circle indicator when the "focusedElementId" is different than its element id', () => {
    render(
      <ColumnsItem
        tableId="users"
        column={aColumn({ name: 'id', type: 'bigserial' })}
        constraints={{}}
        focusedElementId={'users__columns__created_at'}
      />,
      { wrapper },
    )

    expect(
      screen.queryByTestId('blink-circle-indicator'),
    ).not.toBeInTheDocument()
  })
})
