import clsx from 'clsx'
import type { FC } from 'react'
import styles from './FileIcon.module.css'

type Props = {
  isHovered?: boolean
  isDragActive?: boolean
}

export const FileIcon: FC<Props> = ({
  isHovered = false,
  isDragActive = false,
}) => {
  return (
    <svg
      className={clsx(
        styles.fileIcon,
        (isHovered || isDragActive) && styles.fileIconHovered,
      )}
      viewBox="0 0 134 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="file-upload-icon-title"
    >
      <title id="file-upload-icon-title">File upload icon</title>
      {isHovered && (
        <defs>
          <filter
            id="filter0_d"
            x="13"
            y="0.75"
            width="108"
            height="118"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="-16" />
            <feGaussianBlur stdDeviation="15" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.113725 0 0 0 0 0.929412 0 0 0 0 0.513726 0 0 0 0.3 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow"
              result="shape"
            />
          </filter>
          <filter
            id="filter1_i"
            x="43"
            y="46.75"
            width="48"
            height="62"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="10" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.113725 0 0 0 0 0.929412 0 0 0 0 0.513726 0 0 0 0.4 0"
            />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
          </filter>
        </defs>
      )}

      {/* Back file - left */}
      <g
        className={clsx(
          styles.fileBackLeft,
          (isHovered || isDragActive) && styles.fileBackLeftHover,
        )}
      >
        <path
          d="M38 32H68L82 46V86C82 87.1046 81.1046 88 80 88H38C36.8954 88 36 87.1046 36 86V34C36 32.8954 36.8954 32 38 32Z"
          fill="#141616"
          stroke="#5F6366"
          strokeWidth="2"
        />
      </g>

      {/* Back file - right */}
      <g
        className={clsx(
          styles.fileBackRight,
          (isHovered || isDragActive) && styles.fileBackRightHover,
        )}
      >
        <path
          d="M52 32H82L96 46V86C96 87.1046 95.1046 88 94 88H52C50.8954 88 50 87.1046 50 86V34C50 32.8954 50.8954 32 52 32Z"
          fill="#141616"
          stroke="#5F6366"
          strokeWidth="2"
        />
      </g>

      {/* Front file */}
      {isHovered || isDragActive ? (
        <g filter="url(#filter0_d)">
          <g filter="url(#filter1_i)">
            <path
              d="M46.0174 46.75H76.4463L90 60.582V100.732C90 101.847 89.0966 102.75 87.9824 102.75H46.0174C44.9034 102.75 44 101.847 44 100.732V48.7674C44 47.1009 44.3509 46.75 46.0174 46.75Z"
              fill="#232526"
            />
          </g>
          <path
            d="M46.0176 46.75H76.4463L90 60.582V100.732C90 101.847 89.0966 102.75 87.9824 102.75H46.0176C44.9034 102.75 44 101.847 44 100.732V48.7676C44 47.7229 44.7941 46.8639 45.8115 46.7607L46.0176 46.75Z"
            stroke="#1DED83"
            strokeWidth="2"
          />
          <path
            d="M75.5688 46.8263V61.2447L89.7903 61.2445"
            stroke="#1DED83"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M73 71.75L67 65.75L61 71.75"
            stroke="#1DED83"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M67 65.75V79.75"
            stroke="#1DED83"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <g>
          <path
            d="M46.0176 46.75H76.4463L90 60.582V100.732C90 101.847 89.0966 102.75 87.9824 102.75H46.0176C44.9034 102.75 44 101.847 44 100.732V48.7676C44 47.7229 44.7941 46.8639 45.8115 46.7607L46.0176 46.75Z"
            fill="#202222"
            stroke="#5F6366"
            strokeWidth="2"
          />
          <path
            d="M75.5688 46.8263V61.2447L89.7903 61.2445"
            stroke="#5F6366"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M73 71.75L67 65.75L61 71.75"
            stroke="#5F6366"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M67 65.75V79.75"
            stroke="#5F6366"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  )
}
