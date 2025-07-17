import { RadioGroup, RadioGroupItem } from '@liam-hq/ui'
import { type FC, useCallback } from 'react'
import { safeParse } from 'valibot'
import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useVersionOrThrow } from '@/providers'
import { type ShowMode, showModeSchema } from '@/schemas/showMode'
import { useUserEditingOrThrow } from '@/stores'
import styles from './ShowModeMenuRadioGroup.module.css'

const OPTION_LIST: { value: ShowMode; label: string }[] = [
  { value: 'ALL_FIELDS', label: 'All Fields' },
  { value: 'TABLE_NAME', label: 'Table Name' },
  { value: 'KEY_ONLY', label: 'Key Only' },
]

export const ShowModeMenuRadioGroup: FC = () => {
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
      <RadioGroup value={showMode} onValueChange={handleChangeValue}>
        {OPTION_LIST.map(({ value, label }) => (
          <RadioGroupItem key={value} value={value} label={label} />
        ))}
      </RadioGroup>
    </div>
  )
}
