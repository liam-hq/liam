'use client'

import { X } from 'lucide-react'
import {
  type FC,
  type HTMLAttributes,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { match } from 'ts-pattern'
import { JackAnimationForDark } from './JackAnimationForDark'
import { JackAnimationForLight } from './JackAnimationForLight'
import {
  wrapperStyle,
  textStyle,
  linkStyle,
  buttonStyle
} from "./Banner.style"

const HEIGHT = '3rem'

type Props = PropsWithChildren &
  HTMLAttributes<HTMLDivElement> & {
    variant: 'light' | 'dark'
    link: string
  }

export const Banner: FC<Props> = ({
  variant,
  id,
  link,
  children,
  ...props
}) => {
  const [open, setOpen] = useState(true)
  const globalKey = id ? `nd-banner-${id}` : null

  useEffect(() => {
    if (globalKey) setOpen(localStorage.getItem(globalKey) !== 'true')
  }, [globalKey])

  const onClick = useCallback(() => {
    setOpen(false)
    if (globalKey) localStorage.setItem(globalKey, 'true')
  }, [globalKey])

  if (!open) return null

  return (
    <div id={id} {...props} className={wrapperStyle({ variant })}>
      {open && (
        <style>
          {globalKey
            ? `:root:not(.${globalKey}) { --fd-banner-height: ${HEIGHT}; }`
            : `:root { --fd-banner-height: ${HEIGHT}; }`}
        </style>
      )}
      {globalKey && (
        <>
          <style>{`.${globalKey} #${id} { display: none; }`}</style>
          <script
            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{
              __html: `if (localStorage.getItem('${globalKey}') === 'true') document.documentElement.classList.add('${globalKey}');`,
            }}
          />
        </>
      )}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          {match(variant)
            .with('light', () => <JackAnimationForLight />)
            .with('dark', () => <JackAnimationForDark />)
            .exhaustive()}
          <p className={textStyle({ variant })}>
            <span>{'< '}</span>
            {children}
          </p>
        </div>
        {/* NOTE: The link might be on the same domain, but it's likely a different application than `docs`, so we don't use Link. */}
        <a href={link} className={linkStyle({ variant })}>
          Learn More
        </a>
      </div>
      {id && (
        <button
          type="button"
          aria-label="Close Banner"
          className={buttonStyle({ variant })}
          onClick={onClick}
        >
          <X className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
