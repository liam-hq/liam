import { renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { afterEach, expect, it, vi } from 'vitest'
import * as Store from '../../../../../../../stores'
import { UserEditingProvider } from '../../../../../../../stores'
import { useSubscribeShowModeCommand } from './useSubscribeSwitchShowMode'

const mockSetShowMode = vi.fn()

const originalUseUserEditingOnThrow = Store.useUserEditingOrThrow
vi.spyOn(Store, 'useUserEditingOrThrow').mockImplementation(() => {
  const original = originalUseUserEditingOnThrow()
  return {
    ...original,
    setShowMode: mockSetShowMode,
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

const wrapper = ({ children }: React.PropsWithChildren) => (
  <NuqsTestingAdapter>
    <UserEditingProvider>{children}</UserEditingProvider>
  </NuqsTestingAdapter>
)

it('switches to all fields show mode by ⇧2', async () => {
  const user = userEvent.setup()
  renderHook(() => useSubscribeShowModeCommand(), { wrapper })

  await user.keyboard('{Shift>}2{/Shift}')

  expect(mockSetShowMode).toHaveBeenCalledWith('ALL_FIELDS')
})

it('switches to table name show mode by ⇧3', async () => {
  const user = userEvent.setup()
  renderHook(() => useSubscribeShowModeCommand(), { wrapper })

  await user.keyboard('{Shift>}3{/Shift}')

  expect(mockSetShowMode).toHaveBeenCalledWith('TABLE_NAME')
})

it('switches to key only show mode by ⇧4', async () => {
  const user = userEvent.setup()
  renderHook(() => useSubscribeShowModeCommand(), { wrapper })

  await user.keyboard('{Shift>}4{/Shift}')

  expect(mockSetShowMode).toHaveBeenCalledWith('KEY_ONLY')
})
