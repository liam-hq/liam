'use client'

import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import clsx from 'clsx'
import emojiRegex from 'emoji-regex'
import type { CSSProperties, FC, HTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import styles from './MarkdownContent.module.css'

type CodeProps = {
  inline?: boolean
  className?: string
  children?: ReactNode
  style?: CSSProperties
} & HTMLAttributes<HTMLElement>

type MarkdownContentProps = {
  content: string
}

export const MarkdownContent: FC<MarkdownContentProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props: CodeProps) {
          const { children, className, ...rest } = props
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match && !className

          return !isInline && match ? (
            <div className={styles.codeBlockWrapper}>
              <SyntaxHighlighter
                // @ts-expect-error - syntaxTheme has a complex type structure that's compatible at runtime
                style={syntaxTheme}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  ...syntaxCustomStyle,
                  margin: 0,
                  overflow: 'visible',
                  background: 'transparent',
                  padding: 0,
                }}
                codeTagProps={syntaxCodeTagProps}
                {...rest}
              >
                {String(children)}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className={clsx(styles.code, className)} {...rest}>
              {children}
            </code>
          )
        },
        ul({ children, ...props }) {
          return (
            <ul className={styles.ul} {...props}>
              {children}
            </ul>
          )
        },
        ol({ children, ...props }) {
          return (
            <ol className={styles.ol} {...props}>
              {children}
            </ol>
          )
        },
        li({ children, ...props }) {
          // Check if the list item starts with an emoji or special character
          const textContent: string =
            typeof children === 'string'
              ? children
              : Array.isArray(children) && typeof children[0] === 'string'
                ? children[0]
                : ''

          const regex = emojiRegex()
          const startsWithEmoji = regex.test(textContent.trim())

          const className = clsx(
            styles.li,
            startsWithEmoji && styles.liWithEmoji,
          )

          return (
            <li className={className} {...props}>
              {children}
            </li>
          )
        },
        h1({ children, ...props }) {
          return (
            <h1 className={styles.h1} {...props}>
              {children}
            </h1>
          )
        },
        h2({ children, ...props }) {
          return (
            <h2 className={styles.h2} {...props}>
              {children}
            </h2>
          )
        },
        h3({ children, ...props }) {
          return (
            <h3 className={styles.h3} {...props}>
              {children}
            </h3>
          )
        },
        h4({ children, ...props }) {
          return (
            <h4 className={styles.h4} {...props}>
              {children}
            </h4>
          )
        },
        h5({ children, ...props }) {
          return (
            <h5 className={styles.h5} {...props}>
              {children}
            </h5>
          )
        },
        h6({ children, ...props }) {
          return (
            <h6 className={styles.h6} {...props}>
              {children}
            </h6>
          )
        },
        p({ children, ...props }) {
          return (
            <p className={styles.p} {...props}>
              {children}
            </p>
          )
        },
        strong({ children, ...props }) {
          return (
            <strong className={styles.strong} {...props}>
              {children}
            </strong>
          )
        },
        em({ children, ...props }) {
          return (
            <em className={styles.em} {...props}>
              {children}
            </em>
          )
        },
        del({ children, ...props }) {
          return (
            <del className={styles.del} {...props}>
              {children}
            </del>
          )
        },
        blockquote({ children, ...props }) {
          return (
            <blockquote className={styles.blockquote} {...props}>
              {children}
            </blockquote>
          )
        },
        hr({ ...props }) {
          return <hr className={styles.hr} {...props} />
        },
        a({ children, ...props }) {
          return (
            <a className={styles.a} {...props}>
              {children}
            </a>
          )
        },
        table({ children, ...props }) {
          return (
            <div className={styles.tableWrapper}>
              <table className={styles.table} {...props}>
                {children}
              </table>
            </div>
          )
        },
        thead({ children, ...props }) {
          return (
            <thead className={styles.thead} {...props}>
              {children}
            </thead>
          )
        },
        tbody({ children, ...props }) {
          return (
            <tbody className={styles.tbody} {...props}>
              {children}
            </tbody>
          )
        },
        tr({ children, ...props }) {
          return (
            <tr className={styles.tr} {...props}>
              {children}
            </tr>
          )
        },
        th({ children, ...props }) {
          return (
            <th className={styles.th} {...props}>
              {children}
            </th>
          )
        },
        td({ children, ...props }) {
          return (
            <td className={styles.td} {...props}>
              {children}
            </td>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
