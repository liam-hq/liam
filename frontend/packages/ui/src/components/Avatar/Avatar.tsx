'use client'

import clsx from 'clsx'
import type { ComponentProps } from 'react'
import { match } from 'ts-pattern'
import styles from './Avatar.module.css'
import { UserAvatarIcon } from './UserAvatarIcon'

type AvatarSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AvatarUser =
  | 'you'
  | 'collaborator-1'
  | 'collaborator-2'
  | 'collaborator-3'
  | 'collaborator-4'
  | 'collaborator-5'
  | 'collaborator-6'
  | 'collaborator-7'
  | 'collaborator-8'
  | 'collaborator-9'
  | 'collaborator-10'
  | 'collaborator-11'
  | 'jack'

/**
 * Maps a color number to the corresponding AvatarUser type
 * @param colorNum - A number between 1 and 7
 * @returns The corresponding AvatarUser value
 */
export const getAvatarUserFromColor = (colorNum: number): AvatarUser => {
  const colorMap: Record<number, AvatarUser> = {
    1: 'you',
    2: 'collaborator-1',
    3: 'collaborator-2',
    4: 'collaborator-3',
    5: 'collaborator-4',
    6: 'collaborator-5',
    7: 'collaborator-6',
  }
  return colorMap[colorNum] || 'you'
}

type AvatarProps = {
  initial: string
  size?: AvatarSize
  user?: AvatarUser
  color?: string
  onClick?: (() => void) | undefined
} & Omit<ComponentProps<'button'>, 'color'>

export const Avatar = ({
  initial,
  size = 'md',
  user = 'you',
  color,
  onClick,
  ...props
}: AvatarProps) => {
  // Map size to CSS class
  const sizeClass = match(size)
    .with('xxs', () => styles.sizeXxs)
    .with('xs', () => styles.sizeXs)
    .with('sm', () => styles.sizeSm)
    .with('md', () => styles.sizeMd)
    .with('lg', () => styles.sizeLg)
    .with('xl', () => styles.sizeXl)
    .with('2xl', () => styles.size2xl)
    .otherwise(() => styles.sizeMd)

  // Determine background color based on user type
  const backgroundColor: string = color
    ? color
    : match<AvatarUser, string>(user)
        .with('you', () => 'var(--collaborator-color-you)')
        .with('collaborator-1', () => 'var(--collaborator-color-1)')
        .with('collaborator-2', () => 'var(--collaborator-color-2)')
        .with('collaborator-3', () => 'var(--collaborator-color-3)')
        .with('collaborator-4', () => 'var(--collaborator-color-4)')
        .with('collaborator-5', () => 'var(--collaborator-color-5)')
        .with('collaborator-6', () => 'var(--collaborator-color-6)')
        .with('collaborator-7', () => 'var(--collaborator-color-7)')
        .with('collaborator-8', () => 'var(--collaborator-color-8)')
        .with('collaborator-9', () => 'var(--collaborator-color-9)')
        .with('collaborator-10', () => 'var(--primary-accent)')
        .with('collaborator-11', () => 'var(--primary-accent)')
        .with('jack', () => 'var(--primary-accent)')
        .otherwise(() => 'var(--avatar-background)')

  // Special case for Jack avatar which uses an image
  if (user === 'jack') {
    return (
      <button
        className={clsx(styles.avatar, sizeClass)}
        style={{ backgroundColor }}
        onClick={onClick}
        aria-label="User profile"
        type="button"
        {...props}
      >
        <UserAvatarIcon />
      </button>
    )
  }

  return (
    <button
      className={clsx(styles.avatar, sizeClass)}
      style={{ backgroundColor }}
      onClick={onClick}
      aria-label="User profile"
      type="button"
      {...props}
    >
      {initial}
    </button>
  )
}
