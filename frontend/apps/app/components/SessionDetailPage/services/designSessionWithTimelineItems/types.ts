import type { fetchDesignSessionWithTimelineItems } from './fetchDesignSessionWithTimelineItems'

export type DesignSessionWithTimelineItems = Awaited<
  ReturnType<typeof fetchDesignSessionWithTimelineItems>
>
