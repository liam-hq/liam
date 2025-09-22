import type { useAnimationState } from './useAnimationState'
import type { useExpandState } from './useExpandState'
import type { useToolData } from './useToolData'

export const useEventHandlers = (
  animationState: ReturnType<typeof useAnimationState>,
  expandState: ReturnType<typeof useExpandState>,
  onNavigate: (tab: 'erd' | 'artifact') => void,
  toolInfo?: ReturnType<typeof useToolData>['toolInfo'],
) => {
  const handleArgumentsReady = () => {
    animationState.setArgumentsReady(true)
  }

  const handleToggle = () => {
    expandState.setIsCollapsed((prev) => !prev)
  }

  const handleToggleArgumentsExpand = () => {
    expandState.setIsArgumentsExpanded((prev) => !prev)
  }

  const handleToggleResultExpand = () => {
    expandState.setIsResultExpanded((prev) => !prev)
  }

  const handleNavigateClick = () => {
    if (onNavigate && toolInfo?.resultAction) {
      const tab = toolInfo.resultAction.type === 'erd' ? 'erd' : 'artifact'
      onNavigate(tab)
    }
  }

  return {
    handleArgumentsReady,
    handleToggle,
    handleToggleArgumentsExpand,
    handleToggleResultExpand,
    handleNavigateClick,
  }
}
