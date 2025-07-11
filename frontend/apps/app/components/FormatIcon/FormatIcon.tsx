import type { FC } from 'react'
import { match } from 'ts-pattern'
import {
  type IconProps,
  PostgresIcon,
  PrismaIcon,
  SchemaRbIcon,
  TblsIcon,
} from './icons'

/**
 * Supported database schema format types
 */
export type FormatType = 'postgres' | 'prisma' | 'schemarb' | 'tbls'

/**
 * Props for the FormatIcon component
 */
type FormatIconProps = {
  /** The format type to display an icon for */
  format: FormatType
  /** The size of the icon in pixels (default: 16) */
  size?: number
} & Omit<IconProps, 'size'>

/**
 * Displays an icon representing a database schema format
 */
export const FormatIcon: FC<FormatIconProps> = ({ format, size = 16 }) => {
  return match(format)
    .with('postgres', () => <PostgresIcon size={size} />)
    .with('prisma', () => <PrismaIcon size={size} />)
    .with('schemarb', () => <SchemaRbIcon size={size} />)
    .with('tbls', () => <TblsIcon size={size} />)
    .otherwise(() => <PostgresIcon size={size} />)
}
