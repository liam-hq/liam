import {
  Check,
  Code,
  DropdownMenuItemIndicator,
  DropdownMenuPrimitiveRadioItem,
  GitBranch,
} from '@liam-hq/ui'
import type { ComponentProps, FC } from 'react'
import styles from './BranchRadioItem.module.css'

type Props = ComponentProps<typeof DropdownMenuPrimitiveRadioItem> & {
  label: string
  showIcon?: boolean
  isProtected?: boolean
}

export const BranchRadioItem: FC<Props> = ({
  label,
  showIcon = false,
  isProtected = false,
  ...props
}) => {
  return (
    <DropdownMenuPrimitiveRadioItem {...props} className={styles.item}>
      <div className={styles.content}>
        {showIcon ? (
          <span className={styles.icon}>
            <GitBranch width={16} height={16} />
          </span>
        ) : (
          <span className={styles.iconSpacer} />
        )}
        <span className={styles.label}>
          {label}
          {isProtected && (
            <Code size="sm" style="fill">
              production
            </Code>
          )}
        </span>
      </div>
      <DropdownMenuItemIndicator>
        <Check width={10} height={10} />
      </DropdownMenuItemIndicator>
    </DropdownMenuPrimitiveRadioItem>
  )
}
