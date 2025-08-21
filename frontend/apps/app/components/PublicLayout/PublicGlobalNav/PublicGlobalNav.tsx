import { globalNavStyles } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import { LiamDbLogo, LiamLogoMark } from '@/logos'

export const PublicGlobalNav: FC = () => {
  return (
    <div className={clsx(globalNavStyles.globalNavContainer)}>
      <nav className={clsx(globalNavStyles.globalNav)}>
        <div className={clsx(globalNavStyles.logoContainer)}>
          <div className={clsx(globalNavStyles.logoSection)}>
            <div className={clsx(globalNavStyles.iconContainer)}>
              <LiamLogoMark />
            </div>
            <div className={clsx(globalNavStyles.labelArea)}>
              <LiamDbLogo className={clsx(globalNavStyles.liamMigrationLogo)} />
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
