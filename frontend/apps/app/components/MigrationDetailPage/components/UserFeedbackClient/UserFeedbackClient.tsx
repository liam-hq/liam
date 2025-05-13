'use client'
import { UserFeedbackComponent } from './UserFeedbackComponent'

type UserFeedbackClientProps = {
  traceId: string | null
}

export function UserFeedbackClient({ traceId }: UserFeedbackClientProps) {
  return <UserFeedbackComponent traceId={traceId} />
}
