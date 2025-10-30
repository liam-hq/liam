import { ResizablePanel, ResizablePanelGroup, Skeleton } from '@liam-hq/ui'
import type { FC } from 'react'
import { AiMessageSkeleton } from './AiMessageSkeleton'
import styles from './Fallback.module.css'
import { HumanMessageSkeleton } from './HumanMessageSkeleton'

type Props = {
  panelSizes: number[]
}

export const Fallback: FC<Props> = ({ panelSizes }) => {
  return (
    <div className={styles.container}>
      <ResizablePanelGroup direction="horizontal" className={styles.columns}>
        <ResizablePanel
          defaultSize={panelSizes[0]}
          minSize={22}
          maxSize={70}
          isResizing={false}
        >
          <div className={styles.chatSection}>
            <HumanMessageSkeleton />
            <AiMessageSkeleton noOfLines={4} />
            <AiMessageSkeleton noOfLines={7} />
            <AiMessageSkeleton noOfLines={3} />
            <AiMessageSkeleton noOfLines={6} />
            <AiMessageSkeleton noOfLines={5} />
          </div>
        </ResizablePanel>
        <ResizablePanel
          defaultSize={panelSizes[1]}
          minSize={30}
          maxSize={78}
          isResizing={false}
        >
          <div className={styles.outputSection}>
            <Skeleton
              variant="box"
              width="100%"
              height="100%"
              startColor="var(--global-background)"
              endColor="color-mix(in srgb, var(--global-background) 97%, var(--global-foreground))"
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
