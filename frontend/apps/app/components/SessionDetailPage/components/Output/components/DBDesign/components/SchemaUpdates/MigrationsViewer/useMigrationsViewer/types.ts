export type ReviewComment = {
  fromLine: number
  toLine: number
  severity: 'High' | 'Medium' | 'Low'
  message: string
}
