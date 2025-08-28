export const SSE_EVENTS = {
  MESSAGES: 'messages',
  END: 'end',
} as const

export type SseEventType = (typeof SSE_EVENTS)[keyof typeof SSE_EVENTS]
