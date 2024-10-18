'use client'

import { type FC, useEffect } from 'react'
import { destroy, init } from 'tocbot'
import styles from './TableOfContents.module.css'

type Props = {
  contentSelector: string
}

export const TableOfContents: FC<Props> = ({ contentSelector }) => {
  useEffect(() => {
    init({
      tocSelector: '.toc',
      contentSelector: `.${contentSelector}`,
      headingSelector: 'h2',
    })

    return () => destroy()
  }, [contentSelector])

  return (
    <div className={styles.wrapper}>
      <span className={styles.title}>Table of Contents</span>
      <div className="toc" />
    </div>
  )
}
