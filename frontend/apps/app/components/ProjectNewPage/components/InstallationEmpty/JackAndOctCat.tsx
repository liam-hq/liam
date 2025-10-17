import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<'svg'>

export const JackAndOctCat: FC<Props> = (props) => {
  return (
    <svg
      role="img"
      aria-label="Jack and GitHub Octocat"
      width={120}
      height={84}
      viewBox="0 0 120 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Left creature (similar to Jack) */}
      <g>
        <circle cx="32" cy="42" r="28" fill="#1DED83" opacity="0.1" />
        <path
          d="M20 35C20 28 26 22 32 22C38 22 44 28 44 35V52C44 58 38 64 32 64C26 64 20 58 20 52V35Z"
          fill="#1DED83"
          opacity="0.3"
        />
        <circle cx="27" cy="38" r="3" fill="#1DED83" />
        <circle cx="37" cy="38" r="3" fill="#1DED83" />
        <path
          d="M26 46C26 46 29 49 32 49C35 49 38 46 38 46"
          stroke="#1DED83"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Right creature (Octocat style) */}
      <g>
        <circle cx="88" cy="42" r="28" fill="#1DED83" opacity="0.1" />
        <path
          d="M76 35C76 28 82 22 88 22C94 22 100 28 100 35V52C100 58 94 64 88 64C82 64 76 58 76 52V35Z"
          fill="#1DED83"
          opacity="0.3"
        />
        <circle cx="83" cy="38" r="3" fill="#1DED83" />
        <circle cx="93" cy="38" r="3" fill="#1DED83" />
        <path
          d="M82 46C82 46 85 49 88 49C91 49 94 46 94 46"
          stroke="#1DED83"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Tentacles */}
        <path
          d="M72 55C70 58 68 60 68 62"
          stroke="#1DED83"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M104 55C106 58 108 60 108 62"
          stroke="#1DED83"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Sparkles */}
      <g opacity="0.6">
        <circle cx="50" cy="20" r="2" fill="#1DED83" />
        <circle cx="70" cy="15" r="1.5" fill="#1DED83" />
        <circle cx="55" cy="68" r="1.5" fill="#1DED83" />
        <path
          d="M12 28L13 30L15 31L13 32L12 34L11 32L9 31L11 30Z"
          fill="#1DED83"
        />
        <path
          d="M110 50L111 52L113 53L111 54L110 56L109 54L107 53L109 52Z"
          fill="#1DED83"
        />
      </g>
    </svg>
  )
}
