import type { Meta, StoryObj } from '@storybook/react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import { SchemaInfoSection } from './SchemaInfoSection'

const meta = {
  component: SchemaInfoSection,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  render: ({ ...args }) => (
    <div style={{ width: '600px' }}>
      <SchemaInfoSection {...args} />
    </div>
  ),
} satisfies Meta<typeof SchemaInfoSection>

export default meta
type Story = StoryObj<typeof meta>

// Idle state
export const Idle: Story = {
  args: {
    status: 'idle',
  },
}

// Validating state
export const Validating: Story = {
  args: {
    status: 'validating',
  },
}

// Valid state - Default variant (Upload form)
export const ValidDefault: Story = {
  args: {
    status: 'valid',
    schemaName: 'database_schema.sql',
    detectedFormat: 'postgres',
    selectedFormat: 'postgres',
    onFormatChange: (_format: FormatType) => {},
    onRemove: () => {},
  },
}

// Valid state - Simple variant (URL form)
export const ValidSimple: Story = {
  args: {
    status: 'valid',
    schemaName: 'schema.rb',
    schemaUrl: 'https://github.com/user/repo/blob/main/db/schema.rb',
    detectedFormat: 'schemarb',
    selectedFormat: 'schemarb',
    variant: 'simple',
    showRemoveButton: false,
    onFormatChange: (_format: FormatType) => {},
  },
}

// Invalid state - Basic error
export const InvalidBasic: Story = {
  args: {
    status: 'invalid',
    errorMessage:
      'Unsupported file type. Please upload .sql, .rb, .prisma, or .json files.',
  },
}

// Invalid state - With error details and troubleshooting
export const InvalidWithDetails: Story = {
  args: {
    status: 'invalid',
    errorMessage: 'Failed to parse the schema file',
    errorDetails: [
      'Line 10: Syntax error near "CREATE TABLE"',
      'Line 25: Unexpected token ";"',
      'Line 30: Missing closing parenthesis',
    ],
    onViewTroubleshootingGuide: () => {},
  },
}

// Invalid state - Parsing error with has_many (matches screenshot)
export const InvalidParsingErrorHasMany: Story = {
  args: {
    status: 'invalid',
    schemaName: 'schema.rb',
    errorMessage: 'Parsing failed at line 42: unexpected token `has_many`',
    errorDetails: [
      'Line 42: has_many :users, through: :groups',
      "Error: Unexpected token 'has_many'",
      'Context: Unsupported association syntax in current parser version',
    ],
    onViewTroubleshootingGuide: () => {},
  },
}

// Invalid state - Network error
export const InvalidNetworkError: Story = {
  args: {
    status: 'invalid',
    errorMessage:
      'Failed to fetch schema from URL. Please check the URL and try again.',
    onViewTroubleshootingGuide: () => {},
  },
}

// Invalid state - Format mismatch
export const InvalidFormatMismatch: Story = {
  args: {
    status: 'invalid',
    errorMessage: 'The selected format does not match the file extension.',
    onViewTroubleshootingGuide: () => {},
  },
}

// Valid state - Different file formats
export const ValidPostgres: Story = {
  args: {
    status: 'valid',
    schemaName: 'postgres_schema.sql',
    detectedFormat: 'postgres',
    selectedFormat: 'postgres',
    onFormatChange: (_format: FormatType) => {},
    onRemove: () => {},
  },
}

export const ValidRails: Story = {
  args: {
    status: 'valid',
    schemaName: 'schema.rb',
    detectedFormat: 'schemarb',
    selectedFormat: 'schemarb',
    onFormatChange: (_format: FormatType) => {},
    onRemove: () => {},
  },
}

export const ValidPrisma: Story = {
  args: {
    status: 'valid',
    schemaName: 'schema.prisma',
    detectedFormat: 'prisma',
    selectedFormat: 'prisma',
    onFormatChange: (_format: FormatType) => {},
    onRemove: () => {},
  },
}

export const ValidTbls: Story = {
  args: {
    status: 'valid',
    schemaName: 'tbls-schema.json',
    detectedFormat: 'tbls',
    selectedFormat: 'tbls',
    onFormatChange: (_format: FormatType) => {},
    onRemove: () => {},
  },
}

// Long file names
export const ValidLongFileName: Story = {
  args: {
    status: 'valid',
    schemaName:
      'very_long_database_schema_file_name_that_might_overflow_the_container.sql',
    detectedFormat: 'postgres',
    selectedFormat: 'postgres',
    onFormatChange: (_format: FormatType) => {},
    onRemove: () => {},
  },
}

// Multiple errors
export const InvalidManyErrors: Story = {
  args: {
    status: 'invalid',
    errorMessage: 'Multiple parsing errors found',
    errorDetails: Array.from(
      { length: 20 },
      (_, i) => `Line ${i + 1}: Error in SQL syntax`,
    ),
    onViewTroubleshootingGuide: () => {},
  },
}
