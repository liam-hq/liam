import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  GridTableDd,
  GridTableDt,
  GridTableHeader,
  GridTableItem,
  GridTableRoot,
  GridTableRow,
} from './GridTable'

const GridTableExample = () => {
  return (
    <GridTableRoot>
      <GridTableHeader>Product Details</GridTableHeader>
      <GridTableItem>
        <GridTableDt>Name</GridTableDt>
        <GridTableDd>Example Product</GridTableDd>
      </GridTableItem>
      <GridTableItem>
        <GridTableDt>Price</GridTableDt>
        <GridTableDd>$99.99</GridTableDd>
      </GridTableItem>
      <GridTableItem>
        <GridTableDt>Stock</GridTableDt>
        <GridTableDd>Available</GridTableDd>
      </GridTableItem>
      <GridTableRow>Category</GridTableRow>
      <GridTableItem>
        <GridTableDd>Electronics</GridTableDd>
      </GridTableItem>
    </GridTableRoot>
  )
}

const meta = {
  component: GridTableRoot,
  parameters: {
    docs: {
      description: {
        component:
          'A semantic HTML definition list styled as a grid table. Use GridTableRoot, GridTableHeader, GridTableItem, GridTableDt, GridTableDd, and GridTableRow together.',
      },
    },
  },
} satisfies Meta<typeof GridTableRoot>

export default meta
type Story = StoryObj<typeof GridTableRoot>

export const Default: Story = {
  render: () => <GridTableExample />,
}
