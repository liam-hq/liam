import type { FC } from 'react'
import {
  AvatarWithImage,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components'
import { Content } from './Content'
import styles from './UserMenu.module.css'

type Props = {
  avatarUrl: string
}

export const UserMenu: FC<Props> = ({ avatarUrl }) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger className={styles.trigger}>
        <AvatarWithImage src={avatarUrl} alt="User profile" size="sm" />
      </DropdownMenuTrigger>
      <Content />
    </DropdownMenuRoot>
  )
}
