'use client'

import type React from 'react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { parse as parseYaml } from 'yaml'
import styles from './OverrideEditor.module.css'
import { useYamlEditor } from './useYamlEditor'

interface OverrideEditorProps {
  doc: string | undefined
  setDoc: React.Dispatch<React.SetStateAction<string | undefined>>
}

export const OverrideEditor: FC<OverrideEditorProps> = ({ doc, setDoc }) => {
  const { editor } = useYamlEditor({ doc, setDoc })
  const [operationsCount, setOperationsCount] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [showHighlight, setShowHighlight] = useState(false)
  const [prevDoc, setPrevDoc] = useState(doc)

  // docの変更を検出し、operationsCountを更新
  useEffect(() => {
    if (doc && doc !== prevDoc) {
      try {
        const yamlContent = parseYaml(doc)
        if (
          yamlContent?.overrides &&
          Array.isArray(yamlContent.overrides.operations)
        ) {
          const newCount = yamlContent.overrides.operations.length

          // operationsの数が増えた場合のみハイライト表示
          if (newCount > operationsCount) {
            setShowHighlight(true)
            // 2秒後にハイライトを非表示
            setTimeout(() => {
              setShowHighlight(false)
            }, 2000)
          }

          setOperationsCount(newCount)
          setLastUpdateTime(new Date())
        }
      } catch (e) {
        // YAMLのパースエラーは無視
        console.warn('Failed to parse YAML for operation count:', e)
      }

      setPrevDoc(doc)
    }
  }, [doc, prevDoc, operationsCount])

  return (
    <div className={styles.wrapper}>
      {operationsCount > 0 && (
        <div className={styles.operationsSummary}>
          <div className={styles.operationsCount}>
            Operations
            <span className={styles.operationBadge}>{operationsCount}</span>
          </div>
          {lastUpdateTime && (
            <div className={styles.timestamp}>
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      <div className={styles.editorContainer}>
        <div ref={editor} className={styles.wrapper} />
        {showHighlight && <div className={styles.highlightOverlay} />}
      </div>
    </div>
  )
}
