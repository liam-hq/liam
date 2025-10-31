import type { FC } from 'react'
import { SessionItemClient } from './SessionItemClient'
import type { ProjectSession } from './services/fetchProjectSessions'

type Props = {
  session: ProjectSession
}

export const SessionItem: FC<Props> = ({ session }) => {
  return <SessionItemClient session={session} />
}
