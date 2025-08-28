export const SSE_EVENTS = {
  MESSAGES: 'messages',
  END: 'end',
  ERROR: 'error',
} as const

export type SseEventType = (typeof SSE_EVENTS)[keyof typeof SSE_EVENTS]
