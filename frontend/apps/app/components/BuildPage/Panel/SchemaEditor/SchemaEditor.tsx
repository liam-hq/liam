'use client'

import { type FC, useState } from 'react'
import styles from './SchemaEditor.module.css'
import { useEditor } from './useEditor'

type Props = {
  initialDoc: string
}

export const SchemaEditor: FC<Props> = ({ initialDoc }) => {
  const [doc, setDoc] = useState<string>(initialDoc)

  const { editor } = useEditor({ doc, setDoc })

  return <div ref={editor} className={styles.wrapper} />
}
