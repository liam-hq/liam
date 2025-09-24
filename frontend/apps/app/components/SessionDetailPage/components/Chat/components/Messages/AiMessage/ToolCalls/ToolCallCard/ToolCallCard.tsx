'use client'

import type { ToolMessage as ToolMessageType } from '@langchain/core/messages'
import type { ToolCalls } from '@liam-hq/agent/client'
import {
  ArrowTooltipContent,
  ArrowTooltipPortal,
  ArrowTooltipProvider,
  ArrowTooltipRoot,
  ArrowTooltipTrigger,
  Button,
  Check,
  ChevronDown,
  ChevronRight,
  FoldVertical,
  UnfoldVertical,
  Wrench,
  X,
} from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import { ArgumentsDisplay } from './ArgumentsDisplay'
import { useAnimationState } from './hooks/useAnimationState'
import { useEventHandlers } from './hooks/useEventHandlers'
import { useExpandState } from './hooks/useExpandState'
import { useScrollManagement } from './hooks/useScrollManagement'
import { useToolData } from './hooks/useToolData'
import styles from './ToolCallCard.module.css'

type ToolCallItem = ToolCalls[number]

type Props = {
  toolCall: ToolCallItem
  status?: 'pending' | 'running' | 'completed' | 'error'
  error?: string
  toolMessage?: ToolMessageType | undefined
  onNavigate: (tab: 'erd' | 'artifact') => void
}

// Component for expand/collapse button with tooltip
const ExpandButton: FC<{
  isExpanded: boolean
  onClick: () => void
  ariaLabel: { expanded: string; collapsed: string }
  className: string
}> = ({ isExpanded, onClick, ariaLabel, className }) => (
  <ArrowTooltipProvider>
    <ArrowTooltipRoot>
      <ArrowTooltipTrigger asChild>
        <button
          className={className}
          onClick={onClick}
          aria-label={isExpanded ? ariaLabel.expanded : ariaLabel.collapsed}
          type="button"
        >
          {isExpanded ? (
            <FoldVertical size={14} />
          ) : (
            <UnfoldVertical size={14} />
          )}
        </button>
      </ArrowTooltipTrigger>
      <ArrowTooltipPortal>
        <ArrowTooltipContent side="left" align="center">
          {isExpanded ? 'Collapse' : 'Expand'}
        </ArrowTooltipContent>
      </ArrowTooltipPortal>
    </ArrowTooltipRoot>
  </ArrowTooltipProvider>
)

// Component for header chevron icon
const ChevronIcon: FC<{ isCollapsed: boolean; isHovering: boolean }> = ({
  isCollapsed,
  isHovering,
}) => {
  const className = clsx(
    styles.chevron,
    !isHovering ? styles.chevronHidden : '',
  )
  return isCollapsed ? (
    <ChevronRight className={className} />
  ) : (
    <ChevronDown className={className} />
  )
}

export const ToolCallCard: FC<Props> = ({
  toolCall,
  status = 'completed',
  error,
  toolMessage,
  onNavigate,
}) => {
  const isPreCompleted = status === 'completed'
  const isRunning = status === 'pending' || status === 'running'

  // Use custom hooks
  const animationState = useAnimationState(status, isPreCompleted)
  const expandState = useExpandState(status, isPreCompleted)
  const { parsedArguments, toolInfo, result, resultStatus } = useToolData(
    toolCall,
    toolMessage,
  )
  const {
    contentRef,
    resultContentRef,
    handleLineAdded,
    handleArgumentsOverflow,
  } = useScrollManagement(expandState, status, result)
  const {
    handleArgumentsReady,
    handleToggle,
    handleToggleArgumentsExpand,
    handleToggleResultExpand,
    handleNavigateClick,
  } = useEventHandlers(animationState, expandState, onNavigate, toolInfo)

  return (
    <div
      className={styles.container}
      data-status={status}
      data-collapsed={expandState.isCollapsed}
    >
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={!expandState.isCollapsed}
        onMouseEnter={() => expandState.setIsHovering(true)}
        onMouseLeave={() => expandState.setIsHovering(false)}
      >
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <Wrench
                className={clsx(
                  styles.icon,
                  expandState.isHovering ? styles.iconHidden : '',
                  isRunning ? styles.iconAnimated : '',
                )}
              />
              <ChevronIcon
                isCollapsed={expandState.isCollapsed}
                isHovering={expandState.isHovering}
              />
            </div>
            <div className={styles.titleWrapper}>
              <span className={styles.toolName}>{toolInfo.displayName}</span>
              {isRunning && (
                <span className={styles.statusText}>
                  {status === 'pending' ? 'Preparing...' : 'Running...'}
                </span>
              )}
            </div>
          </div>
          <div className={styles.headerRight}>
            {status === 'error' && (
              <span className={styles.badgeError}>Error</span>
            )}
          </div>
        </div>
      </button>

      <div className={styles.contentWrapper}>
        <div className={styles.content} ref={contentRef}>
          {/* Arguments display - use ArgumentsDisplay for all tools */}
          <div className={styles.arguments}>
            <div className={styles.argumentsHeader}>
              <span className={styles.argumentsTitle}>ARGUMENTS</span>
              {expandState.needsExpandButton && (
                <ExpandButton
                  isExpanded={expandState.isArgumentsExpanded}
                  onClick={handleToggleArgumentsExpand}
                  ariaLabel={{
                    expanded: 'Collapse arguments',
                    collapsed: 'Expand arguments',
                  }}
                  className={styles.argumentsExpandButton}
                />
              )}
            </div>
            <ArgumentsDisplay
              args={parsedArguments}
              isAnimated={
                !isPreCompleted && animationState.animationStarted && !isRunning
              }
              onLineAdded={handleLineAdded}
              onReady={handleArgumentsReady}
              isExpanded={expandState.isArgumentsExpanded}
              onOverflowDetected={handleArgumentsOverflow}
              toolName={toolCall.name}
              onAnimationComplete={() =>
                animationState.setArgumentsAnimationComplete(true)
              }
            />
          </div>

          {/* Result display */}
          {(() => {
            const shouldShowResult =
              result &&
              status === 'completed' &&
              (isPreCompleted || animationState.argumentsAnimationComplete)
            if (!shouldShowResult) return null
            return (
              <div className={styles.result}>
                <div className={styles.resultHeader}>
                  <div className={styles.resultTitleWrapper}>
                    <span className={styles.resultTitle}>RESULT</span>
                    {resultStatus === 'error' && (
                      <X className={styles.resultErrorIcon} size={12} />
                    )}
                    {resultStatus === 'success' && (
                      <Check className={styles.resultSuccessIcon} size={12} />
                    )}
                  </div>
                  {expandState.needsResultExpandButton && (
                    <ExpandButton
                      isExpanded={expandState.isResultExpanded}
                      onClick={handleToggleResultExpand}
                      ariaLabel={{
                        expanded: 'Collapse result',
                        collapsed: 'Expand result',
                      }}
                      className={styles.resultExpandButton}
                    />
                  )}
                </div>
                <div className={styles.resultContentWrapper}>
                  {(() => {
                    const showGradients =
                      expandState.isResultScrollable &&
                      !expandState.isResultExpanded
                    if (!showGradients) return null
                    return (
                      <>
                        <div className={styles.resultGradientTop} />
                        <div className={styles.resultGradientBottom} />
                      </>
                    )
                  })()}
                  <div
                    className={styles.resultContent}
                    ref={resultContentRef}
                    data-expanded={expandState.isResultExpanded}
                  >
                    <div className={styles.resultMessage}>
                      <span>{result}</span>
                    </div>
                  </div>
                </div>
                {/* Action button for viewing artifacts */}
                {toolInfo.resultAction && (
                  <div className={styles.resultAction}>
                    <Button
                      size="sm"
                      variant="outline-overlay"
                      onClick={handleNavigateClick}
                    >
                      {toolInfo.resultAction.label}
                    </Button>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Error display */}
          {error && status === 'error' && (
            <div className={styles.error}>
              <span className={styles.errorTitle}>ERROR</span>
              <div className={styles.errorContent}>{error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
