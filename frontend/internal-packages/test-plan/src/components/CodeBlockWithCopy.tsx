import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import type { CSSProperties, FC, HTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import styles from './CodeBlockWithCopy.module.css'

interface CodeBlockWithCopyProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  language: string
  style?: CSSProperties
}

export const CodeBlockWithCopy: FC<CodeBlockWithCopyProps> = ({
  children,
  language,
  ...rest
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className={styles.container}>
      <SyntaxHighlighter
        // @ts-expect-error - syntaxTheme has a complex type structure that's compatible at runtime
        style={syntaxTheme}
        language={language}
        PreTag="div"
        customStyle={syntaxCustomStyle}
        codeTagProps={syntaxCodeTagProps}
        {...rest}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
      <button
        type="button"
        onClick={handleCopy}
        className={styles.copyButton}
        aria-label="Copy code to clipboard"
      >
        {copied ? (
          <span className={styles.copiedText}>Copied!</span>
        ) : (
          <span className={styles.copyText}>Copy</span>
        )}
      </button>
    </div>
  )
}
