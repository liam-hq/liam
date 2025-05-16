'use client'

import type { ComponentProps } from 'react'
import styles from './UserAvatarIcon.module.css'

type UserAvatarIconProps = {
  className?: string
} & ComponentProps<'svg'>

export const UserAvatarIcon = ({
  className,
  ...props
}: UserAvatarIconProps) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${styles.jackIcon} ${className || ''}`}
      {...props}
    >
      <title>User Avatar</title>
      <path
        d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8 2.4C9.32 2.4 10.4 3.48 10.4 4.8C10.4 6.12 9.32 7.2 8 7.2C6.68 7.2 5.6 6.12 5.6 4.8C5.6 3.48 6.68 2.4 8 2.4ZM8 13.76C6 13.76 4.23 12.76 3.2 11.28C3.23 9.64 6.4 8.72 8 8.72C9.59 8.72 12.77 9.64 12.8 11.28C11.77 12.76 10 13.76 8 13.76Z"
        fill="var(--global-background)"
      />
    </svg>
  )
}
