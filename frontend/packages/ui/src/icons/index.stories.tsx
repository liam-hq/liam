import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  BookText,
  Building,
  Building2,
  CardinalityZeroOrManyLeftIcon,
  CardinalityZeroOrOneLeftIcon,
  CardinalityZeroOrOneRightIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  CircleHelp,
  ClipboardList,
  CodeXml,
  Copy,
  CornerDownLeft,
  DiamondFillIcon,
  DiamondIcon,
  Dot,
  Download,
  Ellipsis,
  ErdIcon,
  Eye,
  EyeClosed,
  EyeOff,
  FacebookIcon,
  FileCode,
  FileJson,
  FileText,
  Fingerprint,
  FoldVertical,
  GitBranch,
  GitPullRequestArrow,
  Globe,
  GotoIcon,
  Group,
  Hash,
  Info,
  InfoIcon,
  KeyRound,
  LayoutGrid,
  Library,
  Link,
  Link2,
  List,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  MessagesSquare,
  Mic,
  Minus,
  PanelLeft,
  PanelTop,
  Pause,
  Plus,
  RectangleHorizontal,
  Rows3,
  Scan,
  Search,
  Settings,
  Sparkle,
  Table2,
  TidyUpIcon,
  UnfoldVertical,
  Ungroup,
  Upload,
  Users,
  Waypoints,
  Wrench,
  X,
  XCircle,
  XIcon,
} from './index'

const IconShowcase = () => {
  const iconsMap = {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    BookMarked,
    BookText,
    Building,
    Building2,
    CardinalityZeroOrManyLeftIcon,
    CardinalityZeroOrOneLeftIcon,
    CardinalityZeroOrOneRightIcon,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    ChevronUp,
    CircleHelp,
    ClipboardList,
    CodeXml,
    Copy,
    CornerDownLeft,
    DiamondFillIcon,
    DiamondIcon,
    Dot,
    Download,
    Ellipsis,
    ErdIcon,
    Eye,
    EyeClosed,
    EyeOff,
    FacebookIcon,
    FileCode,
    FileJson,
    FileText,
    Fingerprint,
    FoldVertical,
    GitBranch,
    GitPullRequestArrow,
    Globe,
    GotoIcon,
    Group,
    Hash,
    Info,
    InfoIcon,
    KeyRound,
    LayoutGrid,
    Library,
    Link,
    Link2,
    List,
    Lock,
    LogOut,
    Megaphone,
    Menu,
    MessageSquareText,
    MessagesSquare,
    Mic,
    Minus,
    PanelLeft,
    PanelTop,
    Pause,
    Plus,
    RectangleHorizontal,
    Rows3,
    Scan,
    Search,
    Settings,
    Sparkle,
    Table2,
    TidyUpIcon,
    UnfoldVertical,
    Ungroup, // cspell:disable-line
    Upload,
    Users,
    Waypoints,
    Wrench,
    X,
    XCircle,
    XIcon,
  }

  const _icons = Object.entries(iconsMap).map(([name, Icon]) => ({
    name,
    Icon,
  }))

  const iconItemStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    minWidth: '120px',
  }

  const iconNameStyle = {
    fontSize: '12px',
    textAlign: 'center' as const,
    wordBreak: 'break-word' as const,
  }

  const headingStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
  }

  const gridStyle = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '16px',
  }

  return (
    <div>
      <h2 style={headingStyle}>All Icons</h2>
      <div style={gridStyle}>
        {_icons.map(({ name, Icon }) => (
          <div key={name} style={iconItemStyle}>
            {name.endsWith('Icon') ? (
              <Icon width={24} height={24} />
            ) : (
              <Icon size={24} />
            )}
            <span style={iconNameStyle}>{name}</span>
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
          'A comprehensive showcase of all available icons in the UI library, including both custom icons and Lucide React icons.',
      },
    },
    initialGlobals: {
      backgrounds: { value: 'light' },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const AllIcons: Story = {
  render: () => <IconShowcase />,
}
