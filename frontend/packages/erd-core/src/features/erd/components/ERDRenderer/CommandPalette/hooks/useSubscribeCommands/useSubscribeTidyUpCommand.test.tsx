import { renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { afterEach, expect, it, vi } from 'vitest'
import * as UseFitScreen from '../useFitScreen'
import { useSubscribeTidyUpCommand } from './useSubscribeTidyUpCommand'

const mockTidyUp = vi.fn()

const originalUseFitScreen = UseFitScreen.useFitScreen
vi.spyOn(UseFitScreen, 'useFitScreen').mockImplementation(() => {
  const original = originalUseFitScreen()
  return {
    ...original,
    tidyUp: mockTidyUp,
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

const wrapper = ({ children }: React.PropsWithChildren) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
)

it('tidy up nodes when ⇧t is pressed', async () => {
  const user = userEvent.setup()
  renderHook(() => useSubscribeTidyUpCommand(), { wrapper })

  await user.keyboard('{Shift>}t{/Shift}')

  expect(mockTidyUp).toHaveBeenCalled()
})
