import {
  AlertTriangle,
  Check,
  Code,
  RemoveButton,
  type SchemaStatus,
  Spinner,
} from '@liam-hq/ui'
import type { FC, ReactNode } from 'react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import { FormatIcon } from '../../../../../components/FormatIcon/FormatIcon'
import { FormatSelectDropdown } from '../FormatSelectDropdown'
import { SchemaLink } from '../SchemaLink'
import { type ErrorInfo, ViewErrorsCollapsible } from '../ViewErrorsCollapsible'
import styles from './SchemaInfoSection.module.css'

// Helper function to parse error message and wrap code in backticks with Code component
const parseErrorMessage = (message: string): ReactNode => {
  // Regular expression to find text within backticks
  const parts = message.split(/(`[^`]+`)/g)

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      // Remove backticks and wrap in Code component
      const code = part.slice(1, -1)
      return (
        <Code key={`code-${code.substring(0, 20)}-${index}`} size="sm">
          {code}
        </Code>
      )
    }
    return part
  })
}

// Helper function to render status indicator based on schema status
const renderStatusIndicator = (status: SchemaStatus) => {
  if (status === 'validating') {
    return (
      <>
        <span className={styles.spinner}>
          <Spinner />
        </span>
        <span className={styles.validatingText}>Validating schema...</span>
      </>
    )
  }

  if (status === 'valid') {
    return (
      <>
        <Check size={12} className={styles.checkIcon} />
        <span className={styles.validText}>Valid Schema</span>
      </>
    )
  }

  if (status === 'invalid') {
    return (
      <>
        <AlertTriangle size={12} className={styles.invalidIcon} />
        <span className={styles.invalidText}>Invalid Schema</span>
      </>
    )
  }

  return null
}

// Helper function to render schema info section
const renderSchemaInfo = (
  schemaName: string,
  detectedFormat: FormatType,
  selectedFormat: FormatType,
  variant: 'default' | 'simple',
  schemaUrl?: string,
  showRemoveButton?: boolean,
  onFormatChange?: (format: FormatType) => void,
  onRemove?: () => void,
) => {
  if (variant === 'simple' && schemaUrl) {
    return (
      <div className={styles.simpleSchemaInfo}>
        <div className={styles.simpleSchemaItem}>
          <SchemaLink
            schemaName={schemaName}
            format={detectedFormat}
            href={schemaUrl}
          />
          <FormatSelectDropdown
            selectedFormat={selectedFormat}
            onFormatChange={onFormatChange}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.schemaInfo}>
      <div className={styles.schemaItem}>
        <div className={styles.schemaFile}>
          <FormatIcon format={detectedFormat} size={16} />
          <span className={styles.fileName}>{schemaName}</span>
          {showRemoveButton && onRemove && (
            <RemoveButton
              onClick={onRemove}
              className={styles.removeButton}
              aria-label="Remove schema"
            />
          )}
        </div>
        <FormatSelectDropdown
          selectedFormat={selectedFormat}
          onFormatChange={onFormatChange}
        />
      </div>
    </div>
  )
}

// Helper function to render error actions
const renderErrorActions = (
  errorMessage?: string,
  errorDetails?: string[],
  schemaName?: string,
  onViewTroubleshootingGuide?: () => void,
) => {
  return (
    <div className={styles.errorActions}>
      {errorDetails && errorDetails.length > 0 && (
        <ViewErrorsCollapsible
          error={{
            type: errorMessage?.includes('unsupported')
              ? 'unsupported'
              : 'parsing',
            message: errorMessage || 'Schema validation failed',
            fileName: schemaName,
            details: errorDetails.map((detail) => ({ text: detail })),
            suggestion: errorMessage?.includes('unsupported')
              ? undefined
              : "Confirm you're using ActiveRecord schema DSL, not model definitions.",
          }}
        />
      )}
      {onViewTroubleshootingGuide && (
        <button
          type="button"
          className={styles.troubleshootingLink}
          onClick={onViewTroubleshootingGuide}
        >
          Check out the troubleshooting guide →
        </button>
      )}
    </div>
  )
}

type Props = {
  status: SchemaStatus
  schemaName?: string
  schemaUrl?: string
  detectedFormat?: FormatType
  selectedFormat?: FormatType
  errorMessage?: string
  errorDetails?: string[]
  showRemoveButton?: boolean
  variant?: 'default' | 'simple'
  onFormatChange?: (format: FormatType) => void
  onRemove?: () => void
  onViewTroubleshootingGuide?: () => void
}

export const SchemaInfoSection: FC<Props> = ({
  status,
  schemaName,
  schemaUrl,
  detectedFormat,
  selectedFormat,
  errorMessage,
  errorDetails,
  showRemoveButton = true,
  variant = 'default',
  onFormatChange,
  onRemove,
  onViewTroubleshootingGuide,
}) => {
  if (status === 'idle') {
    return null
  }

  const shouldShowSchemaInfo =
    status === 'valid' &&
    schemaName &&
    detectedFormat &&
    selectedFormat &&
    onFormatChange

  return (
    <div className={styles.container}>
      <div className={styles.statusMessage}>
        <div className={styles.statusIndicator}>
          {renderStatusIndicator(status)}
        </div>
        {status === 'valid' && detectedFormat && (
          <span className={styles.detectedText}>
            Detected as{' '}
            <span className={styles.formatName}>{detectedFormat}</span> based on
            file extension.
          </span>
        )}
        {status === 'invalid' && errorMessage && (
          <span className={styles.errorText}>
            {parseErrorMessage(errorMessage)}
          </span>
        )}
      </div>

      {shouldShowSchemaInfo &&
        renderSchemaInfo(
          schemaName,
          detectedFormat,
          selectedFormat,
          variant,
          schemaUrl,
          showRemoveButton,
          onFormatChange,
          onRemove,
        )}

      {status === 'invalid' &&
        renderErrorActions(
          errorMessage,
          errorDetails,
          schemaName,
          onViewTroubleshootingGuide,
        )}
    </div>
  )
}
