import { act, renderHook, waitFor } from '@testing-library/react'
import { type Node, ReactFlowProvider } from '@xyflow/react'
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { UserEditingProvider } from '../../../../stores'
import { compressToEncodedUriComponent } from '../../../../utils/compressToEncodedUriComponent'
import { useTableVisibility } from './useTableVisibility'

const mockDefaultNodes = vi.fn<() => Node[]>()
const onUrlUpdate = vi.fn<() => [UrlUpdateEvent]>()

const wrapper = ({ children }: { children: ReactNode }) => (
  <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
    <ReactFlowProvider defaultNodes={mockDefaultNodes()}>
      <UserEditingProvider>{children}</UserEditingProvider>
    </ReactFlowProvider>
  </NuqsTestingAdapter>
)

describe('visibilityStatus', () => {
  it('should be "all-hidden" when all table nodes are hidden', () => {
    mockDefaultNodes.mockReturnValueOnce([
      {
        id: '1',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: true,
      },
      {
        id: '2',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: true,
      },
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('all-hidden')
  })

  it('should be "all-visible" when all table nodes are visible', () => {
    mockDefaultNodes.mockReturnValueOnce([
      {
        id: '1',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: false,
      },
      {
        id: '2',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: false,
      },
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('all-visible')
  })

  it('should be "partially-visible" when some table nodes are hidden and the others are visible', () => {
    mockDefaultNodes.mockReturnValueOnce([
      {
        id: '1',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: true,
      },
      {
        id: '2',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: false,
      },
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('partially-visible')
  })
})

describe('showAllNodes', () => {
  it('should make all nodes hidden', async () => {
    mockDefaultNodes.mockReturnValueOnce([
      {
        id: '1',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: true,
      },
      {
        id: '2',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: false,
      },
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('partially-visible')
    act(() => result.current.showAllNodes())

    expect(result.current.visibilityStatus).toBe('all-visible')
    // hidden query parameter should be removed
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ queryString: '?hidden=' }),
      )
    })
  })
})

describe('hideAllNodes', () => {
  it('should make all nodes hidden', async () => {
    mockDefaultNodes.mockReturnValueOnce([
      {
        id: '1',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: true,
      },
      {
        id: '2',
        type: 'table',
        data: {},
        position: { x: 0, y: 0 },
        hidden: false,
      },
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('partially-visible')
    act(() => result.current.hideAllNodes())

    expect(result.current.visibilityStatus).toBe('all-hidden')
    // hidden query parameter should be added with all node ids
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          queryString: `?hidden=${compressToEncodedUriComponent('1,2')}`,
        }),
      )
    })
  })
})
