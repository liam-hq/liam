import 'react'

// NOTE: React.CSSProperties does not accept CSS Variables by default, so override them here
// @see: https://stackoverflow.com/questions/52005083/how-to-define-css-variables-in-style-attribute-in-react-and-typescript
// @see: https://github.com/frenic/csstype#what-should-i-do-when-i-get-type-errors
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Module augmentation must use interface
  interface CSSProperties {
    [key: `--${string}`]: string
  }
}
