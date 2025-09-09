import { Search } from '@liam-hq/ui'
import { Command } from 'cmdk'
import {
  type ComponentProps,
  type FC,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { CommandPaletteInputMode } from '../types'
import styles from './CommandPaletteSearchInput.module.css'

type Props = ComponentProps<typeof Command.Input> & {
  mode: CommandPaletteInputMode
  setMode: (mode: CommandPaletteInputMode) => void
}

export const CommandPaletteSearchInput: FC<Props> = ({
  mode,
  setMode,
  ...inputProps
}) => {
  const [value, setValue] = useState('')

  const modePrefix = useMemo(() => {
    switch (mode.type) {
      case 'default':
        return null
      case 'command':
        return '>'
    }
  }, [mode])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (mode.type === 'default') {
        // switch to "command" mode if value is empty and `>` is pressed
        // TODO(command options): uncomment the following lines to release command options
        // if (event.key === '>' && value === '') {
        //   event.preventDefault()
        //   setMode({ type: 'command' })
        //   return
        // }

        return
      }

      if (mode.type === 'command') {
        // switch to "default" mode if value is empty and delete key is pressed
        if (event.key === 'Backspace' && value === '') {
          event.preventDefault()
          setMode({ type: 'default' })
          return
        }

        return
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [value, mode, setMode])

  return (
    <div className={styles.container}>
      <Search className={styles.searchIcon} />
      <div className={styles.inputContainer}>
        {modePrefix && <span className={styles.modePrefix}>{modePrefix}</span>}
        <Command.Input
          {...inputProps}
          value={value}
          onValueChange={setValue}
          className={styles.input}
          placeholder="Search"
        />
      </div>
    </div>
  )
}
