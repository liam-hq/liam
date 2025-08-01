import type { Meta, StoryObj } from '@storybook/react'
import { TableOfContents } from './TableOfContents'

const meta = {
  component: TableOfContents,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', gap: '32px', height: '800px' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          <h1 id="business-requirement">Business Requirement</h1>
          <p>
            Build an e-commerce order management system and optimize order
            processing flow
          </p>

          <h2 id="requirements">Requirements</h2>

          <h3 id="functional-requirements">Functional Requirements</h3>

          <h4 id="order-processing">1. Order Processing</h4>
          <p>
            Overall order processing including order creation, updates,
            cancellation, and status management
          </p>
          <div
            style={{ height: '400px', background: '#f0f0f0', padding: '20px' }}
          >
            <p>Content placeholder for scrolling demo</p>
          </div>

          <h4 id="inventory-management">2. Inventory Management</h4>
          <p>Product inventory tracking, updates, and alert functions</p>
          <div
            style={{ height: '400px', background: '#f0f0f0', padding: '20px' }}
          >
            <p>Content placeholder for scrolling demo</p>
          </div>

          <h3 id="non-functional-requirements">Non-Functional Requirements</h3>

          <h4 id="performance">1. Performance</h4>
          <p>Maintain response time within 1 second even under high load</p>

          <h4 id="security">2. Security</h4>
          <p>Customer data encryption, implementation of access control</p>
        </div>
        <div>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof TableOfContents>

export default meta
type Story = StoryObj<typeof meta>

const sampleContent = `# Business Requirement

Build an e-commerce order management system and optimize order processing flow

## Requirements

### Functional Requirements

#### 1. Order Processing

Overall order processing including order creation, updates, cancellation, and status management

#### 2. Inventory Management

Product inventory tracking, updates, and alert functions

### Non-Functional Requirements

#### 1. Performance

Maintain response time within 1 second even under high load

#### 2. Security

Customer data encryption, implementation of access control`

export const Default: Story = {
  name: 'Default TOC',
  args: {
    content: sampleContent,
  },
}

export const ShortContent: Story = {
  name: 'Short Content (Few Headings)',
  args: {
    content: `# Main Title

## Section 1

## Section 2`,
  },
}

export const DeepNesting: Story = {
  name: 'Deep Nesting Levels',
  args: {
    content: `# Level 1 Title

## Level 2 Section A

### Level 3 Subsection A.1

#### Level 4 Item A.1.1

#### Level 4 Item A.1.2

### Level 3 Subsection A.2

## Level 2 Section B

### Level 3 Subsection B.1

#### Level 4 Item B.1.1`,
  },
}

export const LongTitles: Story = {
  name: 'Long Heading Titles',
  args: {
    content: `# This is a Very Long Business Requirement Title That Should Be Handled Properly

## Requirements for Building a Complex System with Multiple Components

### Functional Requirements Including Various Features and Capabilities

#### 1. Order Processing with Advanced Features and Integration Points`,
  },
}

export const WithUseCases: Story = {
  name: 'With Use Cases',
  args: {
    content: `# Business Requirement

Build an e-commerce order management system

## Requirements

### Functional Requirements

#### 1. Order Processing

Manage order creation, updates, and cancellations

**Use Cases:**

1. **Create New Order**
   - Customer can create a new order by adding items to cart
   - **DML Operations:**
     1. INSERT
        \`\`\`sql
        INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)
        \`\`\`

2. **Update Order Status**
   - Admin can update order status to shipped, delivered, etc.
   - **DML Operations:**
     1. UPDATE
        \`\`\`sql
        UPDATE orders SET status = ? WHERE id = ?
        \`\`\`

3. **Cancel Order**
   - Customer can cancel order before shipping
   - **DML Operations:**
     1. UPDATE
        \`\`\`sql
        UPDATE orders SET status = 'cancelled' WHERE id = ?
        \`\`\`

#### 2. Inventory Management

Track and update product inventory levels

**Use Cases:**

1. **Check Stock Level**
   - System checks available stock before order confirmation

2. **Update Inventory**
   - Reduce stock when order is placed

### Non-Functional Requirements

#### 1. Performance

Response time must be under 1 second`,
  },
}

export const Empty: Story = {
  name: 'Empty Content (No Headings)',
  args: {
    content: 'This is just plain text with no headings at all.',
  },
}
