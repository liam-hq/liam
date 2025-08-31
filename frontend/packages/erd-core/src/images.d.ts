declare module '*.png' {
  const value: string | import('next/image').StaticImageData
  export default value
}

declare module '*.mp4' {
  const content: string
  export default content
}
