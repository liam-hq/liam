import clsx from 'clsx'
import { Check, Copy } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactElement } from 'react'

import { type MouseEventHandler, useCallback, useRef, useState } from 'react'

interface CopyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onCopy: () => void
}

function useCopyButton(
  onCopy: () => void,
): [checked: boolean, onClick: MouseEventHandler] {
  const [checked, setChecked] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const callbackRef = useRef(onCopy)
  callbackRef.current = onCopy

  const onClick: MouseEventHandler = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setChecked(false)
    }, 1000)
    setChecked(true)
    callbackRef.current()
  }, [])

  return [checked, onClick]
}

export const CopyButton = ({
  onCopy,
  className,
  ...props
}: CopyButtonProps): ReactElement => {
  const [checked, onClick] = useCopyButton(onCopy)

  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium duration-100 disabled:pointer-events-none disabled:opacity-50 hover:text-fd-accent-foreground transition-opacity group-hover:opacity-100 opacity-0 absolute right-2 top-2 z-[2] backdrop-blur-md',
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {checked ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}
