import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCliVersion } from '@/providers'
import { type ShowMode, showModeSchema } from '@/schemas/showMode'
import { updateShowMode, useUserEditingStore } from '@/stores'
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
import styles from './ShowModeMenu.module.css'

const OPTION_LIST: { value: ShowMode; label: string }[] = [
  { value: 'ALL_FIELDS', label: 'All Fields' },
  { value: 'TABLE_NAME', label: 'Table Name' },
  { value: 'KEY_ONLY', label: 'Key Only' },
]

export const ShowModeMenu: FC = () => {
  const { showMode } = useUserEditingStore()

  const { cliVersion } = useCliVersion()
  const handleChangeValue = useCallback(
    (value: string) => {
      const parsed = safeParse(showModeSchema, value)

      if (parsed.success) {
        updateShowMode(parsed.output)

        toolbarActionLogEvent({
          element: 'changeShowMode',
          showMode: value,
          cliVer: cliVersion.version,
          appEnv: cliVersion.envName,
        })
      }
    },
    [cliVersion.version, cliVersion.envName],
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
