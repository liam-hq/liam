import { anIndex } from '@liam-hq/schema'
import { render, screen } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { FC, PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import * as UseUserEditing from '../../../../../../../../../stores'
import {
  SchemaProvider,
  UserEditingProvider,
} from '../../../../../../../../../stores'
import { IndexesItem } from './IndexesItem'

const mockFocusedElementId = vi.fn()

const originalUseCommandPaletteOrThrow = UseUserEditing.useUserEditingOrThrow
vi.spyOn(UseUserEditing, 'useUserEditingOrThrow').mockImplementation(() => {
  const original = originalUseCommandPaletteOrThrow()
  return {
    ...original,
    focusedElementId: mockFocusedElementId(),
  }
})

const wrapper: FC<PropsWithChildren> = ({ children }) => (
  <NuqsTestingAdapter>
    <SchemaProvider current={{ enums: {}, extensions: {}, tables: {} }}>
      <UserEditingProvider>{children}</UserEditingProvider>
    </SchemaProvider>
  </NuqsTestingAdapter>
)

describe('id', () => {
  it('renders index name as a linked heading', () => {
    render(
      <IndexesItem
        tableId="posts"
        index={anIndex({ name: 'posts_on_user_id' })}
      />,
      { wrapper },
    )

    expect(
      screen.getByRole('heading', {
        name: 'posts_on_user_id',
        level: 3,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'posts_on_user_id' }),
    ).toHaveAttribute('href', '#posts__indexes__posts_on_user_id')
  })
})

describe('type', () => {
  it('renders index type', () => {
    render(
      <IndexesItem
        tableId="posts"
        index={anIndex({ name: 'posts_on_user_id', type: 'gist' })}
      />,
      { wrapper },
    )

    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('gist')).toBeInTheDocument()
  })

  it('should not render index type if the index type is btree', () => {
    render(
      <IndexesItem
        tableId="posts"
        index={anIndex({ name: 'posts_on_user_id', type: 'btree' })}
      />,
      { wrapper },
    )

    expect(screen.queryByText('Type')).not.toBeInTheDocument()
  })
})

describe('columns', () => {
  it('renders a column', () => {
    render(
      <IndexesItem
        tableId="posts"
        index={anIndex({ name: 'posts_on_user_id', columns: ['user_id'] })}
      />,
      { wrapper },
    )

    expect(screen.getByText('Column')).toBeInTheDocument()
    expect(screen.getByText('user_id')).toBeInTheDocument()
  })

  it('renders all columns', () => {
    render(
      <IndexesItem
        tableId="posts"
        index={anIndex({
          name: 'posts_on_user_id_and_status_id',
          columns: ['user_id', 'status_id'],
        })}
      />,
      { wrapper },
    )

    expect(screen.getByText('Columns')).toBeInTheDocument()
    expect(screen.getByText('user_id')).toBeInTheDocument()
    expect(screen.getByText('status_id')).toBeInTheDocument()
  })
})

describe('unique', () => {
  it('renders Yes if index is unique', () => {
    render(
      <IndexesItem
        tableId="posts"
        index={anIndex({ name: 'posts_on_user_id', unique: true })}
      />,
      { wrapper },
    )

    expect(screen.getByText('Unique')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('renders No if index is not unique', () => {
    render(
      <IndexesItem
        tableId="posts"
        index={anIndex({ name: 'posts_on_user_id', unique: false })}
      />,
      { wrapper },
    )

    expect(screen.getByText('Unique')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })
})

describe('blink circle indicator', () => {
  it('renders a blink circle indicator when the "focusedElementId" is same with its element id', () => {
    mockFocusedElementId.mockImplementation(
      () => 'posts__indexes__posts_on_user_id',
    )

    render(
      <IndexesItem
        tableId="posts"
        index={anIndex({ name: 'posts_on_user_id' })}
      />,
      { wrapper },
    )

    expect(screen.getByTestId('blink-circle-indicator')).toBeInTheDocument()
  })

  it('does not render a blink circle indicator when the "focusedElementId" is different than its element id', () => {
    mockFocusedElementId.mockImplementation(
      () => 'posts__indexes__posts_on_status_id',
    )

    render(
      <IndexesItem
        tableId="posts"
        index={anIndex({ name: 'posts_on_user_id' })}
      />,
      { wrapper },
    )

    expect(
      screen.queryByTestId('blink-circle-indicator'),
    ).not.toBeInTheDocument()
  })
})
