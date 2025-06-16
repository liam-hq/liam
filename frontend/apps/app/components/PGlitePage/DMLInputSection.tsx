'use client'

import styles from './DMLInputSection.module.css'
import { QueryResultBox } from './QueryResultBox'
import type { DMLSection } from './utils'

interface DMLInputSectionProps {
  section: DMLSection
  updateDmlInput: (sectionId: string, value: string) => void
  executeDML: (sectionId: string) => Promise<void>
  removeDMLSection: (sectionId: string) => void
}

export function DMLInputSection({
  section,
  updateDmlInput,
  executeDML,
  removeDMLSection,
}: DMLInputSectionProps) {
  return (
    <div className={styles.dmlSection}>
      <div className={styles.dmlHeader}>
        <h3 className={styles.dmlTitle}>DML Use Case</h3>
        <button
          type="button"
          onClick={() => removeDMLSection(section.id)}
          className={`${styles.actionButton} ${styles.dangerButton}`}
          aria-label="Delete DML Section"
        >
          Delete
        </button>
      </div>

      <textarea
        rows={4}
        className={styles.sqlTextarea}
        placeholder="INSERT INTO users (name) VALUES ('Taro'), ('Jiro');
SELECT * FROM users;"
        value={section.dmlInput}
        onChange={(e) => updateDmlInput(section.id, e.target.value)}
      />
      <button
        type="button"
        onClick={() => executeDML(section.id)}
        className={`${styles.actionButton} ${styles.primaryButton}`}
      >
        Execute
      </button>

      {/* DML Execution Results */}
      <div className={styles.buttonGroup}>
        {section.results.map((result) => (
          <QueryResultBox key={result.id} result={result} />
        ))}
      </div>
    </div>
  )
}
