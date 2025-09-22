import { useEffect, useState } from 'react'

type Status = 'pending' | 'running' | 'completed' | 'error'

export const useExpandState = (status: Status, isPreCompleted: boolean) => {
  const [isCollapsed, setIsCollapsed] = useState(() => isPreCompleted)
  const [isHovering, setIsHovering] = useState(false)
  const [isArgumentsExpanded, setIsArgumentsExpanded] = useState(false)
  const [needsExpandButton, setNeedsExpandButton] = useState(false)
  const [isResultExpanded, setIsResultExpanded] = useState(false)
  const [needsResultExpandButton, setNeedsResultExpandButton] = useState(false)
  const [isResultScrollable, setIsResultScrollable] = useState(false)

  useEffect(() => {
    if (status === 'pending' || status === 'running') {
      setIsCollapsed(false)
    } else if (status === 'completed' && !isPreCompleted) {
      setIsCollapsed(false)
    }
  }, [status, isPreCompleted])

  return {
    isCollapsed,
    setIsCollapsed,
    isHovering,
    setIsHovering,
    isArgumentsExpanded,
    setIsArgumentsExpanded,
    needsExpandButton,
    setNeedsExpandButton,
    isResultExpanded,
    setIsResultExpanded,
    needsResultExpandButton,
    setNeedsResultExpandButton,
    isResultScrollable,
    setIsResultScrollable,
  }
}
