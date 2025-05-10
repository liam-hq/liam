import { CommandPalette } from '@/components/CommandPalette'
import type React from 'react'

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommandPalette />
      {children}
    </>
  )
}
