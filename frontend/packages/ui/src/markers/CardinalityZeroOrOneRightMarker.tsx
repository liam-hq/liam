import type { FC, SVGAttributes } from 'react'

type MarkerProps = SVGAttributes<SVGMarkerElement> & {
  id: string
}

export const CardinalityZeroOrOneRightMarker: FC<MarkerProps> = ({
  id,
  ...props
}) => {
  return (
    <svg role="img" aria-label="Zero or One Right Marker">
      <defs>
        <marker
          id={id}
          viewBox="0 0 23 16"
          markerWidth="23"
          markerHeight="16"
          refX="11.5"
          refY="8"
          orient="auto"
          {...props}
        >
          <path
            d="M15.835 12.6601C18.4114 12.6601 20.5 10.5715 20.5 7.99508C20.5 5.41867 18.4114 3.33008 15.835 3.33008C13.2586 3.33008 11.17 5.41867 11.17 7.99508C11.17 10.5715 13.2586 12.6601 15.835 12.6601Z"
            fill="transparent"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.835 3.83008C13.5347 3.83008 11.67 5.69481 11.67 7.99508C11.67 10.2953 13.5347 12.1601 15.835 12.1601C18.1353 12.1601 20 10.2953 20 7.99508C20 5.69481 18.1353 3.83008 15.835 3.83008ZM10.67 7.99508C10.67 5.14253 12.9824 2.83008 15.835 2.83008C18.6876 2.83008 21 5.14253 21 7.99508C21 10.8476 18.6876 13.1601 15.835 13.1601C12.9824 13.1601 10.67 10.8476 10.67 7.99508Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.5 2.83008C6.77614 2.83008 7 3.05394 7 3.33008V12.6634C7 12.9396 6.77614 13.1634 6.5 13.1634C6.22386 13.1634 6 12.9396 6 12.6634V3.33008C6 3.05394 6.22386 2.83008 6.5 2.83008Z"
            fill="currentColor"
          />
        </marker>
      </defs>
    </svg>
  )
}
