import type { FC } from 'react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import {
  SchemaInfoSection,
  type SchemaStatus,
} from '../../GitHubSessionForm/SchemaInfoSection'
import { getFileNameFromUrl } from '../utils/urlValidation'

type Props = {
  showSchemaInfo: boolean
  schemaStatus: SchemaStatus
  urlPath: string
  detectedFormat: FormatType
  selectedFormat: FormatType
  schemaError: string | null
  schemaErrorDetails: string[]
  onFormatChange: (format: FormatType) => void
  onRemove: () => void
}

export const SchemaInfoWrapper: FC<Props> = ({
  showSchemaInfo,
  schemaStatus,
  urlPath,
  detectedFormat,
  selectedFormat,
  schemaError,
  schemaErrorDetails,
  onFormatChange,
  onRemove,
}) => {
  if (!showSchemaInfo) return null

  return (
    <SchemaInfoSection
      status={schemaStatus}
      schemaName={getFileNameFromUrl(urlPath)}
      schemaUrl={urlPath}
      detectedFormat={detectedFormat}
      selectedFormat={selectedFormat}
      errorMessage={schemaError || undefined}
      errorDetails={
        schemaErrorDetails.length > 0 ? schemaErrorDetails : undefined
      }
      variant="simple"
      showRemoveButton={false}
      onFormatChange={onFormatChange}
      onRemove={onRemove}
      onViewTroubleshootingGuide={() => {
        window.open(
          'https://liambx.com/docs/parser/troubleshooting',
          '_blank',
          'noopener,noreferrer',
        )
      }}
    />
  )
}
