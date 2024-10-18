import type { Lang } from '@/features/i18n'
import { type Privacy, allPrivacies } from 'contentlayer/generated'

type Params = {
  lang: Lang
}

export function findPrivacyByLang({ lang }: Params): Privacy | undefined {
  return allPrivacies.find((p) => p.lang === lang)
}
