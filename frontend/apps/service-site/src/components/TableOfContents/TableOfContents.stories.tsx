import type { Meta, StoryObj } from '@storybook/react'

import { TableOfContents } from './'

const StoryComponent = () => {
  return (
    <article className="article" style={{ padding: '0 40px' }}>
      <TableOfContents contentSelector="article" />
      <div>
        <h2>Living in Harmony with Nature: Green Home Design in Hokkaido</h2>

        <p>
          In the beautiful natural setting of Hokkaido, creating a home that
          coexists with the surrounding greenery is not just a trend, but a way
          of life. For software engineers and nature enthusiasts alike,
          designing a green home can provide the perfect balance between modern
          living and natural serenity.
        </p>

        <h3>Integrating Nature into Your Home Design</h3>

        <p>
          When building a home in Hokkaido, consider these elements to bring the
          outside in:
        </p>

        <h4>Large Windows and Glass Walls</h4>

        <p>
          Maximize natural light and views of the surrounding landscape with
          floor-to-ceiling windows. This not only reduces the need for
          artificial lighting but also creates a seamless connection with
          nature.
        </p>

        <h3>Sustainable Materials and Energy Efficiency</h3>

        <p>
          Choose eco-friendly options to minimize your environmental impact:
        </p>

        <h4>Local and Recycled Materials</h4>

        <p>
          Opt for locally sourced wood and recycled materials to reduce
          transportation emissions and support the local economy.
        </p>

        <h2>Designing Spaces for Nature Appreciation</h2>

        <p>
          Create areas within your home that allow you to fully enjoy the
          surrounding nature:
        </p>

        <h2>Smart Home Technology for Green Living</h2>

        <p>
          As a software engineer, you can appreciate how technology can enhance
          green living:
        </p>
      </div>
    </article>
  )
}

const meta = {
  component: StoryComponent,
} satisfies Meta<typeof StoryComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
