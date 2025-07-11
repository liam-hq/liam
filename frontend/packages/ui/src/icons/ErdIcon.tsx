import type { ComponentPropsWithoutRef, FC } from 'react'

type IconProps = ComponentPropsWithoutRef<'svg'> & {
  size?: string | number
}

export const ErdIcon: FC<IconProps> = ({ size, ...props }) => {
  return (
    <svg
      role="img"
      aria-label="Erd"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <g transform="rotate(-90 12 12)">
        <rect x="16" y="16" width="6" height="6" rx="1" />
        <rect x="2" y="16" width="6" height="6" rx="1" />
        <rect x="9" y="2" width="6" height="6" rx="1" />
        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
        <path d="M12 12V8" />
      </g>
    </svg>
  )
}
