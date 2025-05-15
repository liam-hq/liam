'use client'

import { type FC, useState } from 'react'
import { BEFORE } from '../before'
import styles from './SchemaEditor.module.css'
import { useMergeEditor } from './useMergeEditor'

type Props = {
  initialDoc: string
}

export const SchemaEditor: FC<Props> = ({ initialDoc }) => {
  const [doc, setDoc] = useState<string>(initialDoc)

  const { ref } = useMergeEditor({
    original: JSON.stringify(BEFORE, null, 2),
    modified: doc,
    setModified: setDoc,
    mode: 'unified',
  })

  return <div ref={ref} className={styles.wrapper} />
}
