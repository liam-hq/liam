declare module '*.png' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.jpg' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.jpeg' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.gif' {
  const content: import('next/image').StaticImageData
  export default content
}

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGSVGElement>>
  export default content
}

declare module '*.mp4' {
  const src: string
  export default src
}
