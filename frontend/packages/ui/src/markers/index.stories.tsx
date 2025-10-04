import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  CardinalityZeroOrManyLeftMarker,
  CardinalityZeroOrOneLeftMarker,
  CardinalityZeroOrOneRightMarker,
} from './index'

const MarkerShowcase = () => {
  const markersMap = {
    CardinalityZeroOrManyLeftMarker,
    CardinalityZeroOrOneLeftMarker,
    CardinalityZeroOrOneRightMarker,
  }

  const markers = Object.entries(markersMap).map(([name, Marker]) => ({
    name,
    Marker,
  }))

  return (
    <div>
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '16px',
        }}
      >
        All Markers
      </h2>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        {markers.map(({ name, Marker }) => (
          <div
            key={name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '24px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              minWidth: '200px',
            }}
          >
            <Marker id={name} />
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              role="img"
              aria-label={`${name} example`}
            >
              <title>{name} example</title>
              <line
                x1="20"
                y1="60"
                x2="100"
                y2="60"
                stroke="currentColor"
                strokeWidth="2"
                markerEnd={`url(#${name})`}
              />
            </svg>
            <span
              style={{
                fontSize: '14px',
                textAlign: 'center',
                wordBreak: 'break-word',
                fontWeight: 'bold',
              }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const meta = {
  parameters: {
    docs: {
      description: {
        component:
          'A comprehensive showcase of all available SVG markers in the UI library. These markers are used for ERD relationship lines.',
      },
    },
    initialGlobals: {
      backgrounds: { value: 'light' },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const AllMarkers: Story = {
  render: () => <MarkerShowcase />,
}
