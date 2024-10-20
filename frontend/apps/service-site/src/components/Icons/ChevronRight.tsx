import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<'svg'>

export const ChevronRight: FC<Props> = (props) => {
  return (
    <svg
      role="img"
      aria-label="ChevronRight"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <g clip-path="url(#clip0_554_3278)">
        <path
          d="M7.05806 4.55806C7.30214 4.31398 7.69786 4.31398 7.94194 4.55806L12.9419 9.55806C13.186 9.80214 13.186 10.1979 12.9419 10.4419L7.94194 15.4419C7.69786 15.686 7.30214 15.686 7.05806 15.4419C6.81398 15.1979 6.81398 14.8021 7.05806 14.5581L11.6161 10L7.05806 5.44194C6.81398 5.19786 6.81398 4.80214 7.05806 4.55806Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_554_3278">
          <rect width={20} height={20} fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  )
}
