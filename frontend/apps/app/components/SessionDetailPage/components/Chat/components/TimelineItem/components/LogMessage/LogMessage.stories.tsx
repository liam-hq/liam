import type { Meta, StoryObj } from '@storybook/nextjs'
import { LogMessage } from './LogMessage'

const meta = {
  component: LogMessage,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    content: {
      control: 'text',
    },
  },
} satisfies Meta<typeof LogMessage>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    content: `Starting database schema analysis. I'll examine all tables, their structures, relationships, indexes, and constraints in sequence.

Currently analyzing the users table. This table contains 15 columns with a UUID type id column as the primary key. I've confirmed that indexes are set on the email, created_at, and updated_at columns.

Moving on to analyze the posts table. This table has 12 columns with a BIGINT type id as the primary key. Indexes are configured on user_id, status, and published_at columns for performance optimization.

Relationship validation results show a one-to-many relationship between the users and posts tables. Additionally, I've confirmed a many-to-many relationship between posts and tags tables through an intermediate table called post_tags.

During the analysis, I've discovered several optimization opportunities. For example, the posts.title column is currently defined as VARCHAR(255), but after checking the actual data, the maximum length is 187 characters. Therefore, I suggest changing it to VARCHAR(200).`,
  },
}

export const HeadingsAndParagraphs: Story = {
  args: {
    content: `# Heading Level 1
## Heading Level 2
### Heading Level 3
#### Heading Level 4
##### Heading Level 5
###### Heading Level 6

This is a regular paragraph with some text. It can span multiple lines and will wrap accordingly.

This is another paragraph separated by a blank line.`,
  },
}

export const TextEmphasis: Story = {
  args: {
    content: `**Bold text** and __alternative bold__

*Italic text* and _alternative italic_

***Bold and italic*** and ___alternative bold italic___

~~Strikethrough text~~

**Combining *italic* within bold**

*Combining **bold** within italic*`,
  },
}

export const InlineCode: Story = {
  args: {
    content: `This is a paragraph with \`inline code\` in the middle.

Use \`git commit -m "message"\` to commit changes.

The \`useState()\` hook returns \`[state, setState]\`.`,
  },
}

// === Lists ===

export const UnorderedLists: Story = {
  args: {
    content: `Unordered list with dashes:
- First item
- Second item
- Third item

Unordered list with asterisks:
* First item
* Second item
* Third item

Nested unordered list:
- First level
  - Second level
    - Third level
  - Back to second
- Back to first`,
  },
}

export const OrderedLists: Story = {
  args: {
    content: `Simple ordered list:
1. First item
2. Second item
3. Third item

Ordered list with different starting number:
5. Fifth item
6. Sixth item
7. Seventh item

Nested ordered list:
1. First level
   1. Second level
   2. Another second level
      1. Third level
      2. Another third level
2. Back to first`,
  },
}

export const MixedLists: Story = {
  args: {
    content: `Mixed nested lists:
1. Ordered first level
   - Unordered second level
   - Another unordered
     1. Ordered third level
     2. Another ordered
   - Back to unordered
2. Back to ordered first
   * Using asterisk
   * Another asterisk`,
  },
}

export const ChecklistsAndEmojis: Story = {
  args: {
    content: `Task checklist:
- ✅ Completed task
- ❌ Failed task
- ⏳ In progress task
- 🔄 Pending review
- ⚠️ Warning task

Status indicators:
- ✓ Simple checkmark
- ✗ Simple cross
- → Arrow indicator
- • Bullet point`,
  },
}

// === Code Blocks ===

export const CodeBlocks: Story = {
  args: {
    content: `Simple code block:
\`\`\`
function hello() {
  console.log("Hello, World!");
}
\`\`\`

JavaScript code block:
\`\`\`javascript
const array = [1, 2, 3, 4, 5];
const doubled = array.map(x => x * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
\`\`\`

SQL code block:
\`\`\`sql
SELECT u.name, u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.name, u.email
ORDER BY order_count DESC;
\`\`\`

TypeScript code block:
\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const getUser = async (id: string): Promise<User> => {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
};
\`\`\``,
  },
}

// === Quotes and Blocks ===

export const BlockQuotes: Story = {
  args: {
    content: `> This is a blockquote
> It can span multiple lines

> Nested blockquotes
>> Second level quote
>>> Third level quote

> **Blockquote** with *formatting*
> - List item in quote
> - Another item
> 
> \`Code\` in blockquote`,
  },
}

// === Tables ===

export const Tables: Story = {
  args: {
    content: `Simple table:
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

Aligned table:
| Left | Center | Right |
|:-----|:------:|------:|
| Left | Center | Right |
| L    | C      | R     |

Complex table:
| Feature | Status | Progress | Notes |
|---------|--------|----------|-------|
| **Login** | ✅ Done | 100% | Working perfectly |
| **Profile** | ⏳ In Progress | 75% | *Needs review* |
| **Settings** | ❌ Blocked | 0% | \`API not ready\` |`,
  },
}

// === Links and References ===

export const LinksAndReferences: Story = {
  args: {
    content: `Inline links:
[GitHub](https://github.com)
[Google](https://google.com "Google Homepage")

Reference links:
[Link reference][1]
[Another reference][example]

[1]: https://example.com "Optional Title"
[example]: https://example.org

Autolinks:
<https://example.com>
<user@example.com>

Link in list:
- [Documentation](https://docs.example.com)
- [API Reference](https://api.example.com)`,
  },
}

// === Complex Examples ===

export const HorizontalRules: Story = {
  args: {
    content: `Section 1

---

Section 2

***

Section 3

___

Section 4`,
  },
}

export const ComplexNesting: Story = {
  args: {
    content: `## Complex Document Structure

This document demonstrates **multiple markdown features** working together.

### Features Included:

1. **Text Formatting**
   - *Italic text*
   - **Bold text**
   - \`Inline code\`

2. **Code Examples**
   \`\`\`javascript
   const example = {
     name: "test",
     value: 42
   };
   \`\`\`

3. **Lists with Details**
   - First item with **bold**
     - Nested with *italic*
     - Another nested item
   - Second item with \`code\`

> **Note:** This is a blockquote with formatting

| Status | Description |
|--------|-------------|
| ✅ | Complete |
| ⏳ | In Progress |
| ❌ | Failed |

---

### Final Notes

Visit [our documentation](https://docs.example.com) for more information.`,
  },
}

// === Special Characters ===

export const SpecialCharacters: Story = {
  args: {
    content: `Special characters and escaping:

Escaped characters: \\* \\_ \\[ \\] \\( \\) \\# \\+ \\- \\. \\!

Math-like expressions: E = mc^2, H~2~O

Symbols: © ® ™ € ¥ £ ° ± × ÷

Arrows: → ← ↑ ↓ ⇒ ⇐ ⇑ ⇓

Special quotes: "curly quotes" 'single quotes' „German quotes" «French quotes»`,
  },
}

// === Real-world Examples ===

export const ErrorLogExample: Story = {
  args: {
    content: `**Error Analysis Report**

## Summary
Found **3 critical errors** during schema validation.

### Error Details:

1. **Foreign Key Constraint Violation**
   \`\`\`sql
   ERROR: insert or update on table "orders" violates foreign key constraint
   DETAIL: Key (user_id)=(999) is not present in table "users".
   \`\`\`
   
   **Solution:** Ensure user exists before creating order
   
2. **Unique Constraint Violation**
   - Table: \`users\`
   - Column: \`email\`
   - Value: \`test@example.com\`
   
3. **Data Type Mismatch**
   > Expected: \`INTEGER\`
   > Received: \`STRING\`

### Resolution Steps:
- [ ] Fix foreign key references
- [ ] Handle duplicate emails
- [ ] Validate data types

---

*Report generated at: 2024-01-01 10:00:00 UTC*`,
  },
}
