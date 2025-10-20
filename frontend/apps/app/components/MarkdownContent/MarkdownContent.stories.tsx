import type { Meta, StoryObj } from '@storybook/nextjs'
import { MarkdownContent } from './MarkdownContent'

const meta = {
  component: MarkdownContent,
  argTypes: {
    content: {
      control: 'text',
      description: 'The markdown content to render',
    },
  },
} satisfies Meta<typeof MarkdownContent>

export default meta
type Story = StoryObj<typeof MarkdownContent>

export const Simple: Story = {
  args: {
    content: '# Hello World\n\nThis is a simple markdown example.',
  },
}

export const WithCodeBlock: Story = {
  args: {
    content: `# Code Example

Here is some code:

\`\`\`typescript
function hello(name: string) {
  console.log(\`Hello, \${name}!\`)
}
\`\`\`
`,
  },
}

export const WithList: Story = {
  args: {
    content: `# List Example

- Item 1
- Item 2
- Item 3

1. First
2. Second
3. Third
`,
  },
}

export const WithTable: Story = {
  args: {
    content: `# Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
`,
  },
}

export const Rich: Story = {
  args: {
    content: `# Rich Markdown Content

## Introduction

This is a **bold** statement with _italic_ text and ~~strikethrough~~.

> This is a blockquote
> with multiple lines

### Code Example

Inline code: \`const x = 42\`

Block code:
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`
}
\`\`\`

### Links and Lists

Check out [this link](https://example.com).

- 🎉 List with emoji
- Regular list item
- Another item

---

That's all!
`,
  },
}
