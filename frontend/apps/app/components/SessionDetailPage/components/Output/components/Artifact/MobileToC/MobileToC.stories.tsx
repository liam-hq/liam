import type { Meta, StoryObj } from '@storybook/nextjs'
import type { TocItem } from '../types'
import { MobileToC } from './MobileToC'

const meta = {
  component: MobileToC,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story, context) => {
      const items: TocItem[] = context.args.items ?? []

      const Heading = ({
        level,
        id,
        children,
      }: {
        level: number
        id: string
        children: React.ReactNode
      }) => {
        const tag = Math.min(Math.max(level, 1), 6)
        if (tag === 1) return <h1 id={id}>{children}</h1>
        if (tag === 2) return <h2 id={id}>{children}</h2>
        if (tag === 3) return <h3 id={id}>{children}</h3>
        if (tag === 4) return <h4 id={id}>{children}</h4>
        if (tag === 5) return <h5 id={id}>{children}</h5>
        return <h6 id={id}>{children}</h6>
      }

      return (
        <div style={{ display: 'grid', gap: 16, height: 600 }}>
          <div>
            <Story />
          </div>
          <div
            style={{
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              background: '#fff',
            }}
          >
            {items.map((it) => (
              <div key={it.id} style={{ marginBottom: 24 }}>
                <Heading level={it.level} id={it.id}>
                  {it.text}
                </Heading>
                <div
                  style={{
                    height: 200,
                    background: '#f3f4f6',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                  }}
                >
                  Content placeholder for scrolling demo
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
  ],
} satisfies Meta<typeof MobileToC>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default (with headings)',
  args: {
    items: [
      { id: 'business-requirement', text: 'Business Requirement', level: 1 },
      { id: 'requirements', text: 'Requirements', level: 2 },
      {
        id: 'functional-requirements',
        text: 'Functional Requirements',
        level: 3,
      },
      { id: 'order-processing', text: '1. Order Processing', level: 4 },
      { id: 'inventory-management', text: '2. Inventory Management', level: 4 },
      {
        id: 'non-functional-requirements',
        text: 'Non-Functional Requirements',
        level: 3,
      },
      { id: 'security', text: 'Security', level: 4 },
      { id: 'performance', text: 'Performance', level: 4 },
    ] satisfies TocItem[],
    activeId: 'business-requirement',
  },
}
