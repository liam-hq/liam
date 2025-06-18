'use client'

import { type FC, useEffect } from 'react'
import { setOrganizationIdCookie } from '@/features/organizations/services/setOrganizationIdCookie'

type Props = {
  orgId: string
}

export const OrgCookie: FC<Props> = ({ orgId }) => {
  useEffect(() => {
    setOrganizationIdCookie(orgId)
  }, [orgId])

  return null
}
