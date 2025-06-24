import {
  Check,
  DropdownMenuItemIndicator,
  DropdownMenuPrimitiveRadioItem,
  GitBranch,
} from '@liam-hq/ui'
import type { ComponentProps, FC } from 'react'
import { ProjectIcon } from '../../../../../components/ProjectIcon'
import styles from './ProjectRadioItem.module.css'

type Props = ComponentProps<typeof DropdownMenuPrimitiveRadioItem> & {
  label: string
  showIcon?: boolean
  isRepository?: boolean
}

export const ProjectRadioItem: FC<Props> = ({
  label,
  showIcon = false,
  isRepository = false,
  ...props
}) => {
  return (
    <DropdownMenuPrimitiveRadioItem {...props} className={styles.item}>
      <div className={styles.content}>
        {showIcon ? (
          <span className={styles.icon}>
            {isRepository ? (
              <GitBranch width={16} height={16} />
            ) : (
              <ProjectIcon width={16} height={16} />
            )}
          </span>
        ) : (
          <span className={styles.iconSpacer} />
        )}
        <span className={styles.label}>{label}</span>
      </div>
      <DropdownMenuItemIndicator>
        <Check width={10} height={10} />
      </DropdownMenuItemIndicator>
    </DropdownMenuPrimitiveRadioItem>
  )
}
