import type { Meta } from '@storybook/react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import { SchemaInfoSection } from './SchemaInfoSection'

const meta = {
  title: 'Features/Sessions/SchemaInfoSection',
  component: SchemaInfoSection,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SchemaInfoSection>

export default meta

// Idle state
export const Idle = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection status="idle" />
    </div>
  ),
}

// Validating state
export const Validating = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection status="validating" />
    </div>
  ),
}

// Valid state - Default variant (Upload form)
export const ValidDefault = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="valid"
        schemaName="database_schema.sql"
        detectedFormat="postgres"
        selectedFormat="postgres"
        onFormatChange={(_format: FormatType) => {}}
        onRemove={() => {}}
      />
    </div>
  ),
}

// Valid state - Simple variant (URL form)
export const ValidSimple = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="valid"
        schemaName="schema.rb"
        schemaUrl="https://github.com/user/repo/blob/main/db/schema.rb"
        detectedFormat="schemarb"
        selectedFormat="schemarb"
        variant="simple"
        showRemoveButton={false}
        onFormatChange={(_format: FormatType) => {}}
      />
    </div>
  ),
}

// Invalid state - Basic error
export const InvalidBasic = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="invalid"
        errorMessage="Unsupported file type. Please upload .sql, .rb, .prisma, or .json files."
      />
    </div>
  ),
}

// Invalid state - With error details and troubleshooting
export const InvalidWithDetails = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="invalid"
        errorMessage="Failed to parse the schema file"
        errorDetails={[
          'Line 10: Syntax error near "CREATE TABLE"',
          'Line 25: Unexpected token ";"',
          'Line 30: Missing closing parenthesis',
        ]}
        onViewTroubleshootingGuide={() => {}}
      />
    </div>
  ),
}

// Invalid state - Parsing error with has_many (matches screenshot)
export const InvalidParsingErrorHasMany = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="invalid"
        schemaName="schema.rb"
        errorMessage="Parsing failed at line 42: unexpected token `has_many`"
        errorDetails={[
          'Line 42: has_many :users, through: :groups',
          "Error: Unexpected token 'has_many'",
          'Context: Unsupported association syntax in current parser version',
        ]}
        onViewTroubleshootingGuide={() => {}}
      />
    </div>
  ),
}

// Invalid state - Network error
export const InvalidNetworkError = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="invalid"
        errorMessage="Failed to fetch schema from URL. Please check the URL and try again."
        onViewTroubleshootingGuide={() => {}}
      />
    </div>
  ),
}

// Invalid state - Format mismatch
export const InvalidFormatMismatch = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="invalid"
        errorMessage="The selected format does not match the file extension."
        onViewTroubleshootingGuide={() => {}}
      />
    </div>
  ),
}

// Valid state - Different file formats
export const ValidPostgres = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="valid"
        schemaName="postgres_schema.sql"
        detectedFormat="postgres"
        selectedFormat="postgres"
        onFormatChange={(_format: FormatType) => {}}
        onRemove={() => {}}
      />
    </div>
  ),
}

export const ValidRails = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="valid"
        schemaName="schema.rb"
        detectedFormat="schemarb"
        selectedFormat="schemarb"
        onFormatChange={(_format: FormatType) => {}}
        onRemove={() => {}}
      />
    </div>
  ),
}

export const ValidPrisma = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="valid"
        schemaName="schema.prisma"
        detectedFormat="prisma"
        selectedFormat="prisma"
        onFormatChange={(_format: FormatType) => {}}
        onRemove={() => {}}
      />
    </div>
  ),
}

export const ValidTbls = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="valid"
        schemaName="tbls-schema.json"
        detectedFormat="tbls"
        selectedFormat="tbls"
        onFormatChange={(_format: FormatType) => {}}
        onRemove={() => {}}
      />
    </div>
  ),
}

// Long file names
export const ValidLongFileName = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="valid"
        schemaName="very_long_database_schema_file_name_that_might_overflow_the_container.sql"
        detectedFormat="postgres"
        selectedFormat="postgres"
        onFormatChange={(_format: FormatType) => {}}
        onRemove={() => {}}
      />
    </div>
  ),
}

// Multiple errors
export const InvalidManyErrors = {
  render: () => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection
        status="invalid"
        errorMessage="Multiple parsing errors found"
        errorDetails={Array.from(
          { length: 20 },
          (_, i) => `Line ${i + 1}: Error in SQL syntax`,
        )}
        onViewTroubleshootingGuide={() => {}}
      />
    </div>
  ),
}
