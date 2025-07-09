import type { FC } from 'react'

type Props = {
  width?: number
  height?: number
}

// TODO: Replace this with the illustration for the waiting screen once it's ready.
export const PreviewIllustration: FC<Props> = ({ width = 80, height = 60 }) => {
  return (
    <svg
      role="img"
      aria-label="Generating..."
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 234 175"
      fill="none"
    >
      <g clipPath="url(#clip0_457_10419)">
        <path
          d="M116.771 174.501C153.481 174.501 183.241 144.741 183.241 108.031C183.241 71.3202 153.481 41.5605 116.771 41.5605C80.0604 41.5605 50.3008 71.3202 50.3008 108.031C50.3008 144.741 80.0604 174.501 116.771 174.501Z"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g filter="url(#filter0_i_457_10419)">
          <path
            d="M69.896 88.1635C70.7172 84.6348 69.9831 81.4485 68.2564 81.0466C66.5297 80.6448 64.4642 83.1797 63.6431 86.7084C62.8219 90.2371 63.556 93.4234 65.2827 93.8252C67.0094 94.227 69.0749 91.6922 69.896 88.1635Z"
            fill="#141616"
          />
        </g>
        <g filter="url(#filter1_i_457_10419)">
          <path
            d="M66.0153 118.085C67.2774 118.004 68.166 115.851 68 113.278C67.834 110.704 66.6763 108.683 65.4142 108.765C64.152 108.846 63.2635 110.999 63.4295 113.572C63.5954 116.146 64.7532 118.167 66.0153 118.085Z"
            fill="#141616"
          />
        </g>
        <g filter="url(#filter2_i_457_10419)">
          <path
            d="M78.7042 107.008C79.6577 106.947 80.3289 105.32 80.2034 103.374C80.078 101.429 79.2033 99.9014 78.2499 99.9629C77.2964 100.024 76.6252 101.651 76.7506 103.597C76.8761 105.542 77.7508 107.07 78.7042 107.008Z"
            fill="#141616"
          />
        </g>
        <g filter="url(#filter3_i_457_10419)">
          <path
            d="M84.6897 12.4101L84.8897 9.20008C84.8897 9.20008 81.8397 3.80008 85.0497 2.14008C87.4397 0.910078 89.6097 1.74008 91.7697 3.33008C93.0397 4.27008 95.3197 4.86008 96.8497 4.64008C100.72 4.07008 107.61 3.41008 113.23 4.78008C114.57 5.11008 115.96 4.86008 117.06 4.08008C119.52 2.32008 123.19 -0.379922 125.73 0.780078C130.4 2.92008 127.04 8.25008 126.76 10.8001C126.48 13.3501 134.92 23.8501 134.92 35.4601C134.92 44.6501 146.35 45.3201 146.26 50.4701C146.17 55.6301 139.66 58.0101 131.95 52.9101C124.24 47.8101 125.33 55.4101 119.41 55.5001C113.5 55.6001 111.17 54.0801 107.99 50.8101C107.99 50.8101 105.67 48.9001 103.24 51.8901C101.03 54.6201 97.0197 55.8901 93.1397 52.5101C89.2597 49.1401 87.4797 52.4101 84.7197 53.8901C81.9597 55.3801 77.4597 53.3201 76.1597 50.0801C74.8597 46.8401 80.5497 47.1801 81.6997 41.0001L81.9097 39.8201L81.6297 39.4601C78.7997 36.2401 75.4297 29.0001 75.4297 29.0001L84.6797 12.3901L84.6897 12.4101Z"
            fill="#141616"
          />
        </g>
        <path
          d="M93.5498 16.47L71.7198 8.79004C74.3798 10.19 76.3098 14.28 76.2898 19.02C76.2698 24.13 73.9998 28.3 71.0098 29.13L89.4198 27.66C90.0698 21.88 94.8198 23.05 94.8198 23.05C95.2098 18.44 93.5398 16.46 93.5398 16.46L93.5498 16.47Z"
          fill="#008543"
        />
        <path
          d="M101.63 26.8301C95.0702 24.5901 95.0602 22.2001 92.3302 23.2701C87.9802 24.9801 90.2202 32.0801 97.5602 39.2801C104.9 46.4801 104.38 47.1301 107.57 50.4101C110.75 53.6801 113.5 55.6101 119.41 55.5101C125.32 55.4101 124.24 47.8201 131.95 52.9201C139.66 58.0201 146.16 55.6301 146.26 50.4801C146.35 45.3201 135.09 44.6501 134.92 35.4701C134.75 26.2801 128.4 15.9001 127.75 11.4701C127.38 8.9401 130.4 2.9301 125.74 0.800098C123.2 -0.359902 119.53 2.3401 117.07 4.1001C115.97 4.8801 114.58 5.1201 113.24 4.8001C107.62 3.4301 100.73 4.0901 96.8602 4.6601C95.2702 4.8901 92.8602 4.2401 91.6302 3.2401C90.6002 2.4001 89.4002 1.7901 88.0702 1.7101C82.1002 1.3601 83.5102 6.1301 84.4202 8.2401C84.7302 8.9601 84.8602 9.7401 84.8002 10.5101L84.6102 12.9901"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M112.02 18.7502C109.44 20.4902 112.8 26.7202 116.45 24.1802C120.1 21.6402 114.25 17.2502 112.02 18.7502Z"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M94.6594 23.0302C95.2794 17.6502 93.5494 16.4702 93.5494 16.4702L70.8594 8.43018"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M70.3496 29.2602L89.6296 27.7102"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M83.0794 33.1501C83.0794 33.1501 82.8594 34.8401 81.7094 41.0201C80.5594 47.2001 74.8694 46.8601 76.1694 50.1001C77.4694 53.3401 81.9694 55.3901 84.7294 53.9101C87.4894 52.4201 89.2694 49.1501 93.1494 52.5301C97.0294 55.9001 101.209 54.3901 103.399 51.6401"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M69.9855 29.2941C73.5694 29.2334 76.395 24.4794 76.2967 18.6757C76.1984 12.872 73.2135 8.21642 69.6297 8.27709C66.0459 8.33777 63.2203 13.0918 63.3185 18.8955C63.4168 24.6991 66.4017 29.3548 69.9855 29.2941Z"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M71.2307 24.559C69.4237 24.5101 68.04 21.8729 68.1377 18.6659C68.2354 15.4589 69.7656 12.903 71.5726 12.9519"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M71.8463 21.9C72.6415 21.9 73.2863 20.5792 73.2863 18.95C73.2863 17.3208 72.6415 16 71.8463 16C71.051 16 70.4062 17.3208 70.4062 18.95C70.4062 20.5792 71.051 21.9 71.8463 21.9Z"
          fill="#1DED83"
        />
        <path
          d="M75.4395 29.02C75.4395 29.02 78.7995 36.26 81.6395 39.48"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M69.9855 29.2941C73.5694 29.2334 76.395 24.4794 76.2967 18.6757C76.1984 12.872 73.2135 8.21642 69.6297 8.27709C66.0459 8.33777 63.2203 13.0918 63.3185 18.8955C63.4168 24.6991 66.4017 29.3548 69.9855 29.2941Z"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M218.85 104.02H221.92"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M229.22 104.02H232.28"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M225.569 97.3V100.37"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M225.569 107.67V110.73"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.1299 102.79H11.8099"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.6201 102.79H19.3001"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.7197 98.2V99.88"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.7197 105.69V107.37"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M224.14 54.8701H225.82"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M231.62 54.8701H233.31"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M228.72 50.28V51.97"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M228.72 57.77V59.45"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M199.101 36.27V41.74"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M201.84 39.01H196.37"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.24023 127.99V133.46"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.97 130.72H0.5"
          stroke="#1DED83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M187.226 95.6833C172.216 106.653 150.206 118.893 124.776 129.813C73.9764 151.623 28.7464 159.883 23.7564 148.253C23.2764 147.123 23.1864 145.853 23.4664 144.453"
          stroke="#1DED83"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M176.446 65.5934C193.616 62.6834 205.326 63.6734 207.726 69.2734C208.466 70.9934 211.016 75.4934 199.876 85.0834"
          stroke="#1DED83"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M44.3068 121.803C38.7668 125.843 34.1768 129.713 30.7168 133.283"
          stroke="#1DED83"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26.5168 139.583C27.533 139.583 28.3568 138.76 28.3568 137.743C28.3568 136.727 27.533 135.903 26.5168 135.903C25.5006 135.903 24.6768 136.727 24.6768 137.743C24.6768 138.76 25.5006 139.583 26.5168 139.583Z"
          fill="#1DED83"
        />
        <path
          d="M196.656 88.5446L192.451 88L191.907 92.2049L196.111 92.7495L196.656 88.5446Z"
          fill="#1DED83"
        />
      </g>
      <defs>
        <filter
          id="filter0_i_457_10419"
          x="63.3066"
          y="81.0049"
          width="6.92578"
          height="12.8623"
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
          <feOffset />
          <feGaussianBlur stdDeviation="3" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.113725 0 0 0 0 0.929412 0 0 0 0 0.513726 0 0 0 0.4 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_457_10419"
          />
        </filter>
        <filter
          id="filter1_i_457_10419"
          x="63.4092"
          y="108.762"
          width="4.61035"
          height="9.3252"
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
          <feOffset />
          <feGaussianBlur stdDeviation="3" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.113725 0 0 0 0 0.929412 0 0 0 0 0.513726 0 0 0 0.4 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_457_10419"
          />
        </filter>
        <filter
          id="filter2_i_457_10419"
          x="76.7354"
          y="99.9612"
          width="3.4834"
          height="7.04883"
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
          <feOffset />
          <feGaussianBlur stdDeviation="3" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.113725 0 0 0 0 0.929412 0 0 0 0 0.513726 0 0 0 0.4 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_457_10419"
          />
        </filter>
        <filter
          id="filter3_i_457_10419"
          x="75.4297"
          y="0.499512"
          width="70.8301"
          height="55.2434"
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
          <feOffset />
          <feGaussianBlur stdDeviation="14.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.113725 0 0 0 0 0.929412 0 0 0 0 0.513726 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_457_10419"
          />
        </filter>
        <clipPath id="clip0_457_10419">
          <rect width="233.81" height="175" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
