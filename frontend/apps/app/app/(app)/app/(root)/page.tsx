import { urlgen } from '@/libs/routes'
import { redirect } from 'next/navigation'

export default async function Page() {
  redirect(urlgen('design_sessions/new'))
}
