import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  GithubLogo,
  LiamDbLogo,
  LiamLogo,
  LiamLogoMark,
  LinkedInLogo,
  XLogo,
} from './index'

const LogoShowcase = () => {
  const logosMap = {
    GithubLogo,
    LiamDbLogo,
    LiamLogo,
    LiamLogoMark,
    LinkedInLogo,
    XLogo,
  }

  const logos = Object.entries(logosMap).map(([name, Logo]) => ({
    name,
    Logo,
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
        All Logos
      </h2>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        {logos.map(({ name, Logo }) => (
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
            <div
              style={{
                width: '120px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Logo />
            </div>
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
          'A comprehensive showcase of all available logos in the UI library.',
      },
    },
    initialGlobals: {
      backgrounds: { value: 'light' },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const AllLogos: Story = {
  render: () => <LogoShowcase />,
}
