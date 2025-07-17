import {
  Button,
  ChevronDown,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@liam-hq/ui'
import { type FC, useCallback } from 'react'
import { safeParse } from 'valibot'
import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useVersionOrThrow } from '@/providers'
import { type ShowMode, showModeSchema } from '@/schemas/showMode'
import { useUserEditingOrThrow } from '@/stores'
import styles from './ShowModeMenu.module.css'

const OPTION_LIST: { value: ShowMode; label: string }[] = [
  { value: 'ALL_FIELDS', label: 'All Fields' },
  { value: 'TABLE_NAME', label: 'Table Name' },
  { value: 'KEY_ONLY', label: 'Key Only' },
]

export const ShowModeMenu: FC = () => {
  const { showMode, setShowMode } = useUserEditingOrThrow()

  const { version } = useVersionOrThrow()

  const handleChangeValue = useCallback(
    (value: string) => {
      const parsed = safeParse(showModeSchema, value)

      if (parsed.success) {
        setShowMode(parsed.output)

        toolbarActionLogEvent({
          element: 'changeShowMode',
          showMode: value,
          platform: version.displayedOn,
          gitHash: version.gitHash,
          ver: version.version,
          appEnv: version.envName,
        })
      }
    },
    [version, setShowMode],
  )

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>show</span>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost-secondary"
            rightIcon={<ChevronDown />}
            data-testid="show-mode"
            aria-label="Show mode"
          >
            {OPTION_LIST.find((opt) => opt.value === showMode)?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            className={styles.content}
            align="start"
            side="bottom"
            sideOffset={12}
          >
            <DropdownMenuRadioGroup
              value={showMode}
              onValueChange={handleChangeValue}
            >
              {OPTION_LIST.map(({ value, label }) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  label={label}
                />
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  )
}
