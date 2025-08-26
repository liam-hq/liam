import type { AIMessage } from '@langchain/langgraph-sdk'
import type { FC } from 'react'
import styles from './ToolCalls.module.css'

function isComplexValue(value: unknown): boolean {
  return Array.isArray(value) || (typeof value === 'object' && value !== null)
}

type Props = {
  toolCalls: AIMessage['tool_calls']
}

/**
 * TODO: Design Request
 *
 * ## Component Overview
 * Tool Execution History Cards - Visualizes the external tools/functions called by AI during task execution
 *
 * ## Display Elements
 * 1. Tool Name - Name of the executed function (e.g., search_database, analyze_data)
 * 2. Execution ID - Unique identifier for traceability (optional)
 * 3. Parameter List - Arguments passed to the tool in key-value format
 *    - Simple values: Display as plain text
 *    - Complex values (arrays/objects): Display as formatted JSON
 */
export const ToolCalls: FC<Props> = ({ toolCalls }) => {
  if (!toolCalls || toolCalls.length === 0) return null

  return (
    <div className={styles.container}>
      {toolCalls.map((tc, _idx) => {
        const args = tc.args
        const hasArgs = Object.keys(args).length > 0
        return (
          <div key={tc.name} className={styles.toolCall}>
            <div className={styles.header}>
              <h3 className={styles.title}>
                {tc.name}
                {tc.id && <code className={styles.id}>{tc.id}</code>}
              </h3>
            </div>
            {hasArgs ? (
              <table className={styles.table}>
                <tbody>
                  {Object.entries(args).map(([key, value]) => (
                    <tr key={key} className={styles.tableRow}>
                      <td className={styles.keyCell}>{key}</td>
                      <td className={styles.valueCell}>
                        {isComplexValue(value) ? (
                          <code className={styles.complexValue}>
                            {JSON.stringify(value, null, 2)}
                          </code>
                        ) : (
                          String(value)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <code className={styles.emptyArgs}>{'{}'}</code>
            )}
          </div>
        )
      })}
    </div>
  )
}
