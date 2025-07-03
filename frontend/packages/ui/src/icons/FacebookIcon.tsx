import type { ComponentPropsWithoutRef, FC } from 'react'
import { useId } from 'react'

type Props = ComponentPropsWithoutRef<'svg'>

export const FacebookIcon: FC<Props> = (props) => {
  const clipId = useId()

  return (
    <svg
      role="img"
      aria-label="Facebook"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M16 8.0488C16 3.604 12.4184 0 8 0C3.5816 0 0 3.604 0 8.0488C0 12.0664 2.9256 15.396 6.7504 16V10.376H4.7184V8.048H6.7504V6.276C6.7504 4.2584 7.944 3.144 9.772 3.144C10.6472 3.144 11.5624 3.3016 11.5624 3.3016V5.2824H10.5544C9.56 5.2824 9.2504 5.9024 9.2504 6.5384V8.0488H11.4688L11.1144 10.3752H9.2504V16C13.0744 15.396 16 12.0664 16 8.0488Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  )
}
