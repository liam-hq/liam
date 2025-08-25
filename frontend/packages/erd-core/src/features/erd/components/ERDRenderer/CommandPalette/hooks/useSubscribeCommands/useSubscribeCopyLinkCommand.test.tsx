import { renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import * as UseCopyLink from '../useCopyLink'
import { useSubscribeCopyLinkCommand } from './useSubscribeCopyLinkCommand'

afterEach(() => {
  vi.clearAllMocks()
})

const mockCopyLink = vi.fn()

const originalUseCopyLink = UseCopyLink.useCopyLink
vi.spyOn(UseCopyLink, 'useCopyLink').mockImplementation(() => {
  const original = originalUseCopyLink()
  return {
    ...original,
    copyLink: mockCopyLink,
  }
})

const prepareSubscribeCopyLink = async () => {
  const user = userEvent.setup()

  renderHook(() => useSubscribeCopyLinkCommand(), {
    wrapper: ({ children }) => (
      <div>
        <p data-testid="test-copy-link-target">hello world</p>
        {children}
      </div>
    ),
  })

  const copyLinkTarget = screen.getByTestId('test-copy-link-target')

  return {
    user,
    testElements: { copyLinkTarget },
  }
}

it('copies link by ⌘c', async () => {
  const { user } = await prepareSubscribeCopyLink()

  await user.keyboard('{Meta>}c{/Meta}')

  expect(mockCopyLink).toHaveBeenCalledWith()
})

it('does not copy link by ⌘c when some text are selected by pointer', async () => {
  const {
    user,
    testElements: { copyLinkTarget },
  } = await prepareSubscribeCopyLink()

  // select text
  await user.pointer([
    { target: copyLinkTarget, offset: 0, keys: '[MouseLeft>]' },
    { offset: 11 },
    { keys: '[/MouseLeft]' },
  ])
  expect(document.getSelection()?.toString()).toBe('hello world')

  await user.keyboard('{Meta>}c{/Meta}')

  expect(mockCopyLink).not.toHaveBeenCalledWith()
})
