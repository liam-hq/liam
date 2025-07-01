import type { CSSProperties, FC, HTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlockWithCopy } from './CodeBlockWithCopy'
import styles from './MarkdownContent.module.css'

interface CodeProps extends HTMLAttributes<HTMLElement> {
  node?: unknown
  inline?: boolean
  className?: string
  children?: ReactNode
  style?: CSSProperties
}

interface MarkdownContentProps {
  content: string
}

export const MarkdownContent: FC<MarkdownContentProps> = ({ content }) => {
  return (
    <div className={styles.wrapper}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: CodeProps) {
            const { children, className, node, ...rest } = props
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !className

            return !isInline && match ? (
              <CodeBlockWithCopy language={match[1]} {...rest}>
                {String(children).replace(/\n$/, '')}
              </CodeBlockWithCopy>
            ) : (
              <code className={className} {...rest}>
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
