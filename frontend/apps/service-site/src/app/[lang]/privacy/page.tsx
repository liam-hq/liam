import type { PageProps } from '@/app/types'
import { langSchema } from '@/features/i18n'
import { PrivacyPage } from '@/features/privacy'
import { object, parse } from 'valibot'

const paramsSchema = object({
  lang: langSchema,
})

export default function Page({ params }: PageProps) {
  const { lang } = parse(paramsSchema, params)

  return <PrivacyPage lang={lang} />
}
