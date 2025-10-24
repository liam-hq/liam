'use server'

import { cookies } from 'next/headers'
import { ORGANIZATION_ID_KEY } from '../constants'

export async function clearOrganizationIdCookie(): Promise<void> {
  const store = await cookies()
  store.set(ORGANIZATION_ID_KEY, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}
