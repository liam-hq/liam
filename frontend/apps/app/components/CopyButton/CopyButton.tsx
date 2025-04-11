'use client'

import clsx from 'clsx'
import type React from 'react'
import { useState } from 'react'
import styles from './CopyButton.module.css'

interface CopyButtonProps {
  text: string
  className?: string
}

export const CopyButton = ({ text, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={clsx(styles.copyButton, className)}
      aria-label="Copy to clipboard"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <span className={styles.icon}>✓</span>
          <span className={styles.text}>Copied!</span>
        </>
      ) : (
        <>
          <span className={styles.icon}>📋</span>
          <span className={styles.text}>Copy Prompt</span>
        </>
      )}
    </button>
  )
}
