import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<'svg'>

export const LiamLogo: FC<Props> = (props) => {
  return (
    <svg
      role="img"
      aria-label="Liam Logo"
      width={98}
      height={32}
      viewBox="0 0 98 32"
      fill="none"
      {...props}
    >
      <g>
        <path
          d="M36.7939 8.07202H40.035V22.7821H49.1601V25.5242H36.7939V8.07202Z"
          fill="white"
        />
        <path
          d="M51.5778 9.4809C51.1959 9.12418 51.0049 8.67919 51.0049 8.14771C51.0049 7.61624 51.1959 7.17124 51.5778 6.81453C51.9597 6.45781 52.4336 6.27765 52.9993 6.27765C53.565 6.27765 54.0388 6.4488 54.4207 6.7893C54.8027 7.12981 54.9936 7.55859 54.9936 8.07385C54.9936 8.62153 54.8063 9.08275 54.4333 9.45748C54.0604 9.83221 53.5812 10.0178 52.9993 10.0178C52.4173 10.0178 51.9597 9.83942 51.5778 9.4809ZM51.4283 12.2103H54.545V25.5242H51.4283V12.2103Z"
          fill="white"
        />
        <path
          d="M71.6481 12.2103V25.5242H68.6809V23.8036C68.1656 24.436 67.5296 24.9098 66.773 25.2251C66.0163 25.5404 65.1803 25.6989 64.2669 25.6989C62.9716 25.6989 61.8113 25.4161 60.7898 24.8504C59.7683 24.2847 58.9702 23.4884 58.3955 22.4578C57.8226 21.4273 57.5361 20.2311 57.5361 18.8672C57.5361 17.5034 57.8226 16.3126 58.3955 15.2893C58.9684 14.2678 59.7665 13.4732 60.7898 12.9075C61.8113 12.3418 62.9716 12.0608 64.2669 12.0608C65.1317 12.0608 65.9244 12.2103 66.6486 12.5094C67.3711 12.8085 67.998 13.2498 68.5313 13.83V12.2103H71.6481ZM67.4594 21.8849C68.207 21.1211 68.5818 20.1158 68.5818 18.869C68.5818 17.6223 68.207 16.617 67.4594 15.8532C66.7117 15.0893 65.7641 14.7055 64.6164 14.7055C63.4688 14.7055 62.5266 15.0875 61.7861 15.8532C61.0457 16.617 60.6763 17.6223 60.6763 18.869C60.6763 20.1158 61.0457 21.1211 61.7861 21.8849C62.5248 22.6488 63.4688 23.0326 64.6164 23.0326C65.7641 23.0326 66.7099 22.6506 67.4594 21.8849Z"
          fill="white"
        />
        <path
          d="M96.5283 13.5201C97.5084 14.493 98.0002 15.9505 98.0002 17.8962V25.526H94.8835V18.2961C94.8835 17.1323 94.6258 16.2567 94.1106 15.6658C93.5953 15.0767 92.8549 14.7812 91.891 14.7812C90.8443 14.7812 90.0047 15.1271 89.3724 15.8153C88.74 16.5053 88.4247 17.489 88.4247 18.77V25.526H85.3079V18.2961C85.3079 17.1323 85.0503 16.2567 84.5351 15.6658C84.0198 15.0767 83.2793 14.7812 82.3155 14.7812C81.2525 14.7812 80.4076 15.1217 79.7842 15.8027C79.1609 16.4837 78.8492 17.4728 78.8492 18.77V25.526H75.7324V12.2103H78.6997V13.9056C79.1987 13.3075 79.8221 12.8499 80.5697 12.5346C81.3174 12.2193 82.1479 12.0608 83.0631 12.0608C84.0612 12.0608 84.9458 12.2482 85.7187 12.6211C86.4916 12.9958 87.1023 13.5471 87.5509 14.2786C88.0986 13.5813 88.8067 13.0373 89.6696 12.6463C90.5344 12.2554 91.4892 12.0608 92.536 12.0608C94.2151 12.0608 95.5447 12.5472 96.5247 13.5183L96.5283 13.5201Z"
          fill="white"
        />
        <path
          d="M15.1302 31.183C23.516 31.183 30.3141 24.3849 30.3141 15.9991C30.3141 7.61325 23.516 0.815186 15.1302 0.815186C6.74436 0.815186 -0.0537109 7.61325 -0.0537109 15.9991C-0.0537109 24.3849 6.74436 31.183 15.1302 31.183Z"
          fill="#1DED83"
        />
        <path
          d="M9.1663 23.0398C8.99335 23.0343 8.98794 23.0325 9.04199 22.8704C9.21314 22.3515 11.2003 16.3576 12.0272 13.8804C12.0831 13.7147 12.0471 13.5939 11.9444 13.4822C11.258 12.722 10.7895 11.8266 10.3698 10.906C10.0797 10.2664 9.85091 9.59979 9.68696 8.91338C9.65454 8.78006 9.69777 8.74043 9.79326 8.7116C10.3139 8.54946 10.8364 8.39452 11.3571 8.22697C11.4688 8.19094 11.5156 8.19995 11.5588 8.32066C11.712 8.74764 11.8633 9.17642 12.0453 9.59079C12.22 9.98894 12.4272 10.3727 12.629 10.76C12.7227 10.9402 12.8272 11.1167 12.9389 11.2861C13.0488 11.4554 13.056 11.4518 13.1731 11.2771C13.2091 11.223 13.2361 11.1636 13.2686 11.1077C13.6163 10.5258 14.0162 9.98354 14.499 9.50611C15.1801 8.83231 15.971 8.36029 16.9096 8.1441C17.2717 8.06122 17.6356 8.02519 18.0086 8.02159C18.5581 8.01618 19.0985 8.05041 19.63 8.19454C20.2101 8.35128 20.7272 8.62873 21.1992 9.00166C21.7487 9.43585 22.1018 10.0016 22.3306 10.6483C22.4189 10.8969 22.4369 11.1708 22.4801 11.4338C22.4928 11.5149 22.4765 11.6014 22.4838 11.6842C22.5162 12.1437 22.4405 12.5905 22.309 13.0246C22.1829 13.4444 21.9757 13.83 21.7127 14.1795C21.1794 14.8857 20.4912 15.3811 19.657 15.6802C19.194 15.846 18.7202 15.9432 18.2356 16.0189C17.7059 16.1036 17.1762 16.0892 16.6538 16.0531C15.9836 16.0045 15.3224 15.8532 14.699 15.5775C14.5639 15.5181 14.427 15.4604 14.2919 15.401C14.1261 15.3271 14.1099 15.3307 14.0522 15.4964C13.9424 15.8117 12.3876 20.667 12.375 20.7013C12.3479 20.7679 12.3587 20.8076 12.4398 20.8076C12.5137 20.8076 17.8338 20.8076 20.4173 20.8076C20.7434 20.8076 20.7993 20.7463 20.6966 21.1517C20.5596 21.6976 20.4335 22.2452 20.3002 22.7929C20.2408 23.038 20.239 23.0398 19.9849 23.0398C18.1905 23.0398 9.21675 23.0398 9.1609 23.0398H9.1663ZM18.3905 10.2015C18.3635 10.2015 18.3347 10.2033 18.3076 10.2015C17.7077 10.1565 17.1528 10.2862 16.6628 10.6447C16.4178 10.8231 16.189 11.0141 15.9854 11.2483C15.4773 11.832 15.1476 12.5076 14.8432 13.2048C14.8089 13.2841 14.8017 13.3363 14.8918 13.3832C15.1296 13.5057 15.3584 13.6534 15.6034 13.7615C16.0106 13.9417 16.4358 14.075 16.8808 14.102C17.1438 14.1182 17.4086 14.1254 17.6753 14.1164C18.2536 14.0948 18.7905 13.9543 19.2751 13.6444C19.9111 13.2354 20.2552 12.6499 20.2516 11.8824C20.2498 11.4536 20.0786 11.0717 19.785 10.7871C19.4084 10.4213 18.9454 10.1835 18.3923 10.2033L18.3905 10.2015Z"
          fill="black"
        />
      </g>
      <defs>
        <clipPath>
          <rect
            width="98"
            height="30.3696"
            fill="white"
            transform="translate(0 0.815186)"
          />
        </clipPath>
      </defs>
    </svg>
  )
}