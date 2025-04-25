import type { PageProps } from '@/app/types'
import { login } from './actions'

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const returnTo = params.returnTo?.toString() || '/app'

  return (
    <form>
      <input type="hidden" name="returnTo" value={returnTo} />
      <button type="submit" formAction={login}>
        Log in with GitHub
      </button>
    </form>
  )
}
