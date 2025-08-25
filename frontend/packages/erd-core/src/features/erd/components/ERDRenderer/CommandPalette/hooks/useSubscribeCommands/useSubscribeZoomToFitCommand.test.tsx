import { renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { afterEach, expect, it, vi } from 'vitest'
import * as UseFitScreen from '../useFitScreen'
import { useSubscribeZoomToFitCommand } from './useSubscribeZoomToFitCommand'

const mockZoomToFit = vi.fn()

const originalUseFitScreen = UseFitScreen.useFitScreen
vi.spyOn(UseFitScreen, 'useFitScreen').mockImplementation(() => {
  const original = originalUseFitScreen()
  return {
    ...original,
    zoomToFit: mockZoomToFit,
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

const wrapper = ({ children }: React.PropsWithChildren) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
)

it('zooms to fit nodes when ⇧1 is pressed', async () => {
  const user = userEvent.setup()
  renderHook(() => useSubscribeZoomToFitCommand(), { wrapper })

  await user.keyboard('{Shift>}1{/Shift}')

  expect(mockZoomToFit).toHaveBeenCalled()
})
