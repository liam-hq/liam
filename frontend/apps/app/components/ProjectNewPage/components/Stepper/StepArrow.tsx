import type { ComponentPropsWithoutRef, FC } from 'react'

type IconProps = ComponentPropsWithoutRef<'svg'>

export const StepArrow: FC<IconProps> = (props) => {
  return (
    <svg
      role="img"
      aria-label="StepArrow"
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="6"
      viewBox="0 0 100 6"
      fill="none"
      {...props}
    >
      <path
        d="M100 2.88672L95 -3.26633e-05V5.77347L100 2.88672ZM0 3.38672H95.5V2.38672H0V3.38672Z"
        fill="var(--pane-border)"
      />
    </svg>
  )
}
