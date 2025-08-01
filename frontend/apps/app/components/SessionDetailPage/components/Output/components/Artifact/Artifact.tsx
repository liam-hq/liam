'use client'

import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import type { FC, HTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { CopyButton } from '../shared/CopyButton'
import styles from './Artifact.module.css'

type CodeProps = {
  className?: string
  children?: ReactNode
} & HTMLAttributes<HTMLElement>

type Props = {
  doc: string
}

export const Artifact: FC<Props> = ({ doc }) => {
  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <CopyButton textToCopy={doc} tooltipLabel="Copy Markdown" />
      </div>
      <div className={styles.body}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code(props: CodeProps) {
              const { children, className, ...rest } = props
              const match = /language-(\w+)/.exec(className || '')
              const isInline = !match && !className

              return !isInline && match ? (
                <SyntaxHighlighter
                  // @ts-expect-error - syntaxTheme has a complex type structure that's compatible at runtime
                  style={syntaxTheme}
                  language={match[1]}
                  PreTag="div"
                  customStyle={syntaxCustomStyle}
                  codeTagProps={syntaxCodeTagProps}
                  {...rest}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...rest}>
                  {children}
                </code>
              )
            },
          }}
        >
          {doc}
        </ReactMarkdown>
      </div>
    </div>
  )
}
