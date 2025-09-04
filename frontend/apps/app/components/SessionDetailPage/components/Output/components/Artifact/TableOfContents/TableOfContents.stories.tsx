import type { Meta, StoryObj } from '@storybook/nextjs'
import { useId } from 'react'
import { TableOfContents } from './TableOfContents'

const meta = {
  component: TableOfContents,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => {
      const businessRequirementId = useId()
      const requirementsId = useId()
      const functionalRequirementsId = useId()
      const orderProcessingId = useId()
      const inventoryManagementId = useId()
      const nonFunctionalRequirementsId = useId()
      const performanceId = useId()
      const securityId = useId()

      return (
        <div style={{ display: 'flex', gap: '32px', height: '800px' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            <h1 id={businessRequirementId}>Business Requirement</h1>
            <p>
              Build an e-commerce order management system and optimize order
              processing flow
            </p>

            <h2 id={requirementsId}>Requirements</h2>

            <h3 id={functionalRequirementsId}>Functional Requirements</h3>

            <h4 id={orderProcessingId}>1. Order Processing</h4>
            <p>
              Overall order processing including order creation, updates,
              cancellation, and status management
            </p>
            <div
              style={{
                height: '400px',
                background: '#f0f0f0',
                padding: '20px',
              }}
            >
              <p>Content placeholder for scrolling demo</p>
            </div>

            <h4 id={inventoryManagementId}>2. Inventory Management</h4>
            <p>Product inventory tracking, updates, and alert functions</p>
            <div
              style={{
                height: '400px',
                background: '#f0f0f0',
                padding: '20px',
              }}
            >
              <p>Content placeholder for scrolling demo</p>
            </div>

            <h3 id={nonFunctionalRequirementsId}>
              Non-Functional Requirements
            </h3>

            <h4 id={performanceId}>1. Performance</h4>
            <p>Maintain response time within 1 second even under high load</p>

            <h4 id={securityId}>2. Security</h4>
            <p>Customer data encryption, implementation of access control</p>
          </div>
          <div>
            <Story />
          </div>
        </div>
      )
    },
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

Content for section 1.

## Section 2

Content for section 2.`,
  },
}

export const NoHeadings: Story = {
  name: 'No Headings',
  args: {
    content:
      'This is a document without any headings. Just plain text content.',
  },
}

export const LongContent: Story = {
  name: 'Long Content',
  args: {
    content: `# System Architecture

## 1. Frontend Architecture

### 1.1 Component Design

#### 1.1.1 Atomic Design Pattern

##### 1.1.1.1 Atoms

Basic building blocks of the UI.

##### 1.1.1.2 Molecules

Combinations of atoms forming functional units.

#### 1.1.2 Container Components

Smart components that handle business logic.

### 1.2 State Management

#### 1.2.1 Redux Store

Global state management solution.

#### 1.2.2 Context API

React's built-in state management.

## 2. Backend Architecture

### 2.1 API Design

#### 2.1.1 RESTful Endpoints

Standard REST API implementation.

#### 2.1.2 GraphQL Schema

GraphQL API for flexible queries.

### 2.2 Database Layer

#### 2.2.1 PostgreSQL

Primary relational database.

#### 2.2.2 Redis Cache

In-memory data structure store.

## 3. Infrastructure

### 3.1 Cloud Services

#### 3.1.1 AWS

Amazon Web Services deployment.

#### 3.1.2 Azure

Microsoft Azure integration.

## 4. Security Considerations

Implementing security best practices across the stack.`,
  },
}
