import { TableOfContents } from '@/components'
import { type Lang, fallbackLang } from '@/features/i18n'
import { MDXContent } from '@/libs/contentlayer'
import clsx from 'clsx'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import { findPrivacyByLang } from '../../utils'
import styles from './PrivacyPage.module.css'

const TOC_TARGET_CLASS_NAME = 'target-toc'

type Props = {
  lang?: Lang
}

export const PrivacyPage: FC<Props> = ({ lang }) => {
  const privacy = findPrivacyByLang({ lang: lang ?? fallbackLang })
  if (!privacy) notFound()

  return (
    <article className={clsx(TOC_TARGET_CLASS_NAME, styles.wrapper)}>
      <h1 className={styles.h1}>Privacy Policy</h1>
      <div className={styles.container}>
        <div className={styles.left}>
          <TableOfContents contentSelector={TOC_TARGET_CLASS_NAME} />
        </div>
        <div>
          <MDXContent code={privacy.body.code} />
        </div>
      </div>
    </article>
  )
}
