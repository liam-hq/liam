import type { FC, ReactNode } from 'react'
import { DesktopToolbar } from './DesktopToolbar'
import { MobileToolbar } from './MobileToolbar'

type Props = {
  customActions?: ReactNode
}

export const Toolbar: FC<Props> = ({ customActions }) => {
  return (
    <>
      <MobileToolbar />
      <DesktopToolbar customActions={customActions} />
    </>
  )
}
