import { redirect } from 'next/navigation'
import { urlgen } from '@/libs/routes'

export default async function Page() {
  redirect(urlgen('design_sessions/new'))
}
