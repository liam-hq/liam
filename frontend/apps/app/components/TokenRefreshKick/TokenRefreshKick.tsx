'use client'

import { fromPromise } from '@liam-hq/neverthrow'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  trigger?: boolean
}

export function TokenRefreshKick({ trigger = false }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (!trigger) return
    const run = async () => {
      type HttpResponse = {
        ok: boolean
        headers: { get(name: string): string | null }
        json: () => Promise<unknown>
      }
      const hasOk = (v: unknown): v is { ok: unknown } =>
        typeof v === 'object' && v !== null && 'ok' in v
      const onOk = async (res: HttpResponse) => {
        let ok = res.ok
        if (res.headers.get('content-type')?.includes('application/json')) {
          const json = await res.json().catch(() => null)
          if (hasOk(json)) {
            ok = ok && Boolean(json.ok)
          }
        }
        if (ok) {
          router.refresh()
        }
      }
      await fromPromise<HttpResponse>(
        fetch('/api/github/token/refresh', {
          method: 'POST',
          cache: 'no-store',
        }),
      ).match(onOk, () => {})
    }
    run()
  }, [trigger, router])

  return null
}
