import type { FC } from 'react'
import { DesktopToolbar } from './DesktopToolbar'
import { MobileToolbar } from './MobileToolbar'

export const Toolbar: FC = () => {
  return (
    <>
      <MobileToolbar />
      <DesktopToolbar />
    </>
  )
}
