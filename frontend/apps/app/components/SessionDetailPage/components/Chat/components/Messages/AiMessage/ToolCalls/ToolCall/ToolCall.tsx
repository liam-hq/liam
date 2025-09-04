import type { ToolMessage as ToolMessageType } from '@langchain/core/messages'
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
  FoldVertical,
  IconButton,
  UnfoldVertical,
  Wrench,
} from '@liam-hq/ui'
import { type FC, useMemo, useState } from 'react'
import { MarkdownContent } from '../../../../../../../../MarkdownContent'
import markdownStyles from '../../../Markdown.module.css'
import type { ToolCall as ToolCallType } from '../../../schema'
import { extractResponseFromMessage } from '../../../utils/extractResponseFromMessage'
import styles from './ToolCall.module.css'

type Props = {
  toolCall: ToolCallType
  toolMessage: ToolMessageType | undefined
}

export const ToolCall: FC<Props> = ({ toolCall, toolMessage }) => {
  const [open, setOpen] = useState(false)

  const toolCallArgs = `\`\`\`json
${JSON.stringify(toolCall.args, null, 2)}
\`\`\``

  const toolCallResult = useMemo(
    () =>
      toolMessage
        ? extractResponseFromMessage(toolMessage)
        : 'Tool call result not found.',
    [toolMessage],
  )

  return (
    <CollapsibleRoot
      open={open}
      className={styles.wrapper}
      onOpenChange={setOpen}
    >
      <div className={styles.head}>
        <div className={styles.title}>
          <Wrench className={styles.icon} />
          <p className={styles.toolName}>{toolCall.name}</p>
        </div>
        <CollapsibleTrigger asChild>
          <IconButton
            size="sm"
            icon={open ? <FoldVertical /> : <UnfoldVertical />}
            tooltipContent={open ? 'Collapse' : 'Expand'}
          />
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div>
          <span className={styles.sectionTitle}>Arguments</span>
          <div className={markdownStyles.markdownWrapper}>
            <MarkdownContent content={toolCallArgs} />
          </div>
        </div>
        <div>
          <span className={styles.sectionTitle}>Result</span>
          <div className={markdownStyles.markdownWrapper}>
            <MarkdownContent content={toolCallResult} />
          </div>
        </div>
      </CollapsibleContent>
    </CollapsibleRoot>
  )
}
