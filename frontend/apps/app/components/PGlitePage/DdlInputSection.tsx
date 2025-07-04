'use client'

import styles from './DDLInputSection.module.css'
import { QueryResultBox } from './QueryResultBox'
import type { DDLState } from './utils'

interface DDLInputSectionProps {
  ddlState: DDLState
  updateDdlInput: (value: string) => void
  executeDDL: () => Promise<void>
}

export function DDLInputSection({
  ddlState,
  updateDdlInput,
  executeDDL,
}: DDLInputSectionProps) {
  return (
    <div className={styles.playgroundSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>DDL Input Area (Global)</h2>
      </div>
      <p className={styles.description}>
        When you enter and execute DDL, it will be applied to all DML forms. You
        can execute multiple SQL statements at once. Separate each SQL statement
        with a<code className={styles.codeHighlight}>;</code>
        (semicolon).
      </p>
      <textarea
        rows={5}
        className={styles.sqlTextarea}
        placeholder="CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE posts (id SERIAL PRIMARY KEY, title TEXT, user_id INTEGER REFERENCES users(id));"
        value={ddlState.ddlInput}
        onChange={(e) => updateDdlInput(e.target.value)}
      />
      <button
        type="button"
        onClick={executeDDL}
        className={`${styles.actionButton} ${styles.primaryButton}`}
      >
        Execute DDL
      </button>

      {/* DDL Execution Results */}
      <div className={styles.buttonGroup}>
        {ddlState.results.map((result) => (
          <QueryResultBox key={result.id} result={result} />
        ))}
      </div>
    </div>
  )
}
