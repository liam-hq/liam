import type { Meta, StoryObj } from '@storybook/react'
import type { FC } from 'react'
import { ViewErrorsCollapsible } from './ViewErrorsCollapsible'

const meta = {
  component: ViewErrorsCollapsible,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  render: (args) => <ViewErrorsCollapsible {...args} />,
} satisfies Meta<typeof ViewErrorsCollapsible>

export default meta
type Story = StoryObj<typeof meta>

// Parsing error with line numbers
export const ParsingError: Story = {
  args: {
    error: {
      type: 'parsing' as const,
      message: 'schemarb parser failed',
      fileName: 'schema.rb',
      details: [
        { line: 15, column: 23, text: 'unexpected token "{"' },
        {
          line: 15,
          text: 'create_table "users", force: { cascade: true } do |t|',
        },
        { text: '                              ^' },
      ],
      suggestion:
        "Confirm you're using ActiveRecord schema DSL, not model definitions.",
    },
  },
}

// Parsing error with has_many token (matches screenshot pattern)
export const ParsingErrorHasMany: Story = {
  args: {
    error: {
      type: 'parsing' as const,
      message: 'schemarb parser failed',
      fileName: 'schema.rb',
      details: [
        {
          line: 42,
          text: 'Parsing failed at line 42: unexpected token has_many',
        },
        { text: '' },
        { line: 42, text: 'has_many :users, through: :groups' },
        { text: '' },
        { text: 'Error: Unexpected token has_many' },
        { text: '' },
        {
          text: 'Context: Unsupported association syntax in current parser version',
        },
      ],
      suggestion:
        "Confirm you're using ActiveRecord schema DSL, not model definitions.",
    },
  },
}

// Parsing error without line numbers
export const ParsingErrorSimple: Story = {
  args: {
    error: {
      type: 'parsing' as const,
      message: 'schemarb parser failed',
      fileName: 'database_schema.rb',
      details: [
        { text: 'Error: Unsupported syntax found' },
        { text: 'The parser encountered an unexpected structure' },
      ],
      suggestion:
        'Check that your schema file follows standard Rails conventions.',
    },
  },
}

// Unsupported syntax error
export const UnsupportedSyntaxError: Story = {
  args: {
    error: {
      type: 'unsupported' as const,
      message: 'Unsupported Rails feature detected',
      fileName: 'schema.rb',
      details: [
        {
          text: 'Found unsupported option: has_many :through in your schema definition.',
        },
      ],
      explanation:
        'The current parser does not support certain options in the schema. This feature is commonly used in runtime migrations, but is not part of the static schema DSL.',
      suggestions: [
        'If this line is required, consider removing or replacing it temporarily for import.',
        'Otherwise, please report this case so we can improve the parser.',
      ],
    },
  },
  decorators: [
    (Story: FC) => (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
}

// Unsupported syntax with multiple features
export const UnsupportedSyntaxMultiple: Story = {
  args: {
    error: {
      type: 'unsupported' as const,
      message: 'Multiple unsupported features detected',
      fileName: 'complex_schema.rb',
      details: [
        { text: 'The following features are not yet supported:' },
        { text: 'add_foreign_key, enable_extension, and create_join_table' },
      ],
      explanation:
        'These advanced Rails features are not currently supported by the parser.',
      suggestions: [
        'Consider using standard create_table definitions instead.',
        'Remove or comment out these lines temporarily.',
        'Contact support if you need help with schema conversion.',
      ],
    },
  },
}

// Generic error
export const GenericError: Story = {
  args: {
    error: {
      type: 'generic' as const,
      message: 'Failed to process schema file',
      fileName: 'schema.sql',
      details: [
        'The file could not be parsed correctly.',
        'Please ensure the file is valid and try again.',
      ],
    },
  },
}

// Error without filename
export const ErrorWithoutFile: Story = {
  args: {
    error: {
      type: 'generic' as const,
      message: 'Schema validation failed',
      details: [
        'The provided schema contains errors.',
        'Please check the format and try again.',
      ],
    },
  },
}

// Custom trigger text
export const CustomTriggerText: Story = {
  args: {
    error: {
      type: 'parsing' as const,
      message: 'Invalid PostgreSQL syntax',
      details: [
        { text: 'Syntax error near "CREAT TABLE"' },
        { text: 'Did you mean "CREATE TABLE"?' },
      ],
    },
    triggerText: 'Show error details',
  },
}

// Long error with many details
export const LongError: Story = {
  args: {
    error: {
      type: 'unsupported' as const,
      message: 'Multiple schema issues detected',
      fileName: 'legacy_schema.rb',
      details: [
        { text: 'Found deprecated Rails 3.x syntax:' },
        { text: 't.references :user, :polymorphic => true' },
        { text: 'Should be updated to:' },
        { text: 't.references :user, polymorphic: true' },
        { text: '' },
        { text: 'Found legacy migration syntax:' },
        { text: 'ActiveRecord::Migration' },
        { text: 'Should specify version:' },
        { text: 'ActiveRecord::Migration[7.0]' },
      ],
      explanation:
        'Your schema file appears to be using older Rails conventions that are no longer supported.',
      suggestions: [
        'Update to modern Rails syntax (Rails 5.0+)',
        'Use the Rails migration upgrade tool',
        'Manually update the deprecated syntax',
        'Consider regenerating the schema from a fresh database',
      ],
    },
  },
}

// Minimal error
export const MinimalError: Story = {
  args: {
    error: {
      type: 'generic' as const,
      message: 'Schema error',
      details: [],
    },
  },
}

// All error types demo
export const AllErrorTypes: Story = {
  args: {
    // Note: These args are not used - the render function provides its own error data
    error: {
      type: 'generic' as const,
      message: 'Placeholder error (not used)',
      details: [],
    },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <div>
        <h3
          style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}
        >
          Parsing Error
        </h3>
        <ViewErrorsCollapsible
          error={{
            type: 'parsing',
            message: 'schemarb parser failed',
            fileName: 'schema.rb',
            details: [
              { line: 15, column: 23, text: 'unexpected token "{"' },
              {
                line: 15,
                text: 'create_table "users", force: { cascade: true } do |t|',
              },
            ],
            suggestion:
              "Confirm you're using ActiveRecord schema DSL, not model definitions.",
          }}
        />
      </div>

      <div>
        <h3
          style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}
        >
          Unsupported Syntax Error
        </h3>
        <ViewErrorsCollapsible
          error={{
            type: 'unsupported',
            message: 'Unsupported Rails feature detected',
            fileName: 'schema.rb',
            details: [
              {
                text: 'Found unsupported option: has_many :through in your schema definition.',
              },
            ],
            explanation:
              'The current parser does not support certain options in the schema.',
            suggestions: [
              'If this line is required, consider removing or replacing it temporarily for import.',
              'Otherwise, please report this case so we can improve the parser.',
            ],
          }}
        />
      </div>

      <div>
        <h3
          style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}
        >
          Generic Error
        </h3>
        <ViewErrorsCollapsible
          error={{
            type: 'generic',
            message: 'Failed to process schema file',
            fileName: 'schema.sql',
            details: [
              'The file could not be parsed correctly.',
              'Please ensure the file is valid and try again.',
            ],
          }}
        />
      </div>
    </div>
  ),
}
