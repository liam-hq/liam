declare module '*.mp4' {
  const content: string
  export default content
}
declare module '*.png' {
  const content: string | { src: string }
  export default content
}
