import Image from 'next/image'
import type { FC } from 'react'
import schemaRbIcon from '@/public/assets/schema-rb-icon.png'
import type { IconProps } from './types'

export const SchemaRbIcon: FC<IconProps> = ({ size = 16 }) => {
  return (
    <Image
      src={schemaRbIcon}
      alt="schema.rb icon"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  )
}
