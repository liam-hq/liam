import {
  ChevronRight,
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from '@liam-hq/ui'
import { type FC, type ReactNode, useState } from 'react'
import styles from './ViewErrorsCollapsible.module.css'

// Base error structure
type BaseError = {
  type: string
  message: string
  fileName?: string
}

// Parsing error with line information
type ParsingError = BaseError & {
  type: 'parsing'
  details: Array<{
    line?: number
    column?: number
    text: string
  }>
  suggestion?: string
}

// Unsupported syntax error
type UnsupportedSyntaxError = BaseError & {
  type: 'unsupported'
  details: Array<{
    text: string
  }>
  explanation?: string
  suggestions?: string[]
}

// Generic error fallback
type GenericError = BaseError & {
  type: 'generic'
  details: string[]
}

export type ErrorInfo = ParsingError | UnsupportedSyntaxError | GenericError

// Type guards for error types
const isParsingError = (error: ErrorInfo): error is ParsingError => {
  return error.type === 'parsing'
}

const isUnsupportedSyntaxError = (
  error: ErrorInfo,
): error is UnsupportedSyntaxError => {
  return error.type === 'unsupported'
}

const isGenericError = (error: ErrorInfo): error is GenericError => {
  return error.type === 'generic'
}

type Props = {
  error: ErrorInfo
  triggerText?: string
  className?: string
}

export const ViewErrorsCollapsible: FC<Props> = ({
  error,
  triggerText = 'View errors',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const renderDetail = (detail: { text: string }, key: string): ReactNode => {
    return <p key={key}>{detail.text}</p>
  }

  const formatErrorDetails = (): ReactNode => {
    if (isParsingError(error)) {
      return (
        <>
          <p>[ParserError] {error.message}</p>
          <p>&nbsp;</p>
          {error.fileName && (
            <>
              <p>File: {error.fileName}</p>
              <p>&nbsp;</p>
            </>
          )}
          {error.details.map((detail, index) => {
            if (detail.line !== undefined) {
              return (
                <p key={`line-${detail.line}-${detail.column || 0}-${index}`}>
                  Line {detail.line}
                  {detail.column !== undefined && `:${detail.column}`}:{' '}
                  {detail.text}
                </p>
              )
            }
            return renderDetail(
              detail,
              `parsing-detail-${index}-${detail.line || 0}-${detail.column || 0}`,
            )
          })}
          {error.suggestion && (
            <>
              <p>&nbsp;</p>
              <p>Suggestion: {error.suggestion}</p>
            </>
          )}
        </>
      )
    }

    if (isUnsupportedSyntaxError(error)) {
      return (
        <>
          <p>[UnsupportedSyntax] {error.message}</p>
          <p>&nbsp;</p>
          {error.fileName && (
            <>
              <p>File: {error.fileName}</p>
              <p>&nbsp;</p>
            </>
          )}
          {error.details.map((detail, index) =>
            renderDetail(detail, `unsupported-detail-${index}`),
          )}
          {error.explanation && (
            <>
              <p>&nbsp;</p>
              <p>Explanation:</p>
              <p>{error.explanation}</p>
            </>
          )}
          {error.suggestions && error.suggestions.length > 0 && (
            <>
              <p>&nbsp;</p>
              <p>Suggestion:</p>
              <ul className={styles.suggestionList}>
                {error.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )
    }

    // Default case: treat as generic error
    if (isGenericError(error)) {
      return (
        <>
          <p>[Error] {error.message}</p>
          {error.fileName && (
            <>
              <p>&nbsp;</p>
              <p>File: {error.fileName}</p>
            </>
          )}
          {error.details && error.details.length > 0 && (
            <>
              <p>&nbsp;</p>
              {error.details.map((detail) => (
                <p key={detail}>{detail}</p>
              ))}
            </>
          )}
        </>
      )
    }

    // This should never happen, but provide a fallback for exhaustiveness
    return <p>[Error] An unknown error occurred</p>
  }

  return (
    <CollapsibleRoot
      open={isOpen}
      onOpenChange={setIsOpen}
      className={className}
    >
      <CollapsibleTrigger asChild>
        <button type="button" className={styles.trigger} aria-expanded={isOpen}>
          <span
            className={styles.iconContainer}
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <ChevronRight size={12} className={styles.icon} />
          </span>
          <span className={styles.triggerText}>{triggerText}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className={styles.content}>
        <div className={styles.errorContent}>
          <div className={styles.errorDetails}>{formatErrorDetails()}</div>
        </div>
      </CollapsibleContent>
    </CollapsibleRoot>
  )
}
