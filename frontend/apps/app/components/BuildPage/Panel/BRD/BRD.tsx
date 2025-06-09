import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@liam-hq/ui'
import { type FC, useEffect, useState } from 'react'
import { MigrationsViewer } from '../MigrationsViewer'
import { RelatedSchema } from '../RelatedSchema'
import styles from './BRD.module.css'
import type { BRDProps, ExecutionResult, SqlBlock } from './types'

interface HighlighterStyles {
  theme: Record<string, unknown>
  customStyle: Record<string, unknown>
  codeTagProps: Record<string, unknown>
}

const syntaxCustomStyle = {
  borderRadius: 0,
  marginBottom: 0,
}

const SqlHighlighter: FC<{ code: string }> = ({ code }) => {
  const [HighlighterComponent, setHighlighterComponent] = useState<FC<
    Record<string, unknown>
  > | null>(null)
  const [highlighterStyles, setHighlighterStyles] =
    useState<HighlighterStyles | null>(null)

  useEffect(() => {
    const loadHighlighter = async () => {
      try {
        const [highlighterModule, stylesModule] = await Promise.all([
          import('react-syntax-highlighter'),
          import('@liam-hq/ui'),
        ])

        setHighlighterComponent(
          () =>
            highlighterModule.Prism as unknown as FC<Record<string, unknown>>,
        )
        setHighlighterStyles({
          theme: stylesModule.syntaxTheme as Record<string, unknown>,
          customStyle: {
            ...(stylesModule.syntaxCustomStyle as Record<string, unknown>),
            ...(syntaxCustomStyle as Record<string, unknown>),
          },
          codeTagProps: stylesModule.syntaxCodeTagProps as Record<
            string,
            unknown
          >,
        })
      } catch (error) {
        console.error('Failed to load syntax highlighter:', error)
      }
    }
    loadHighlighter()
  }, [])

  if (!HighlighterComponent || !highlighterStyles) {
    return (
      <div className={styles.codeContent}>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className={styles.codeContent}>
      <HighlighterComponent
        language="sql"
        style={highlighterStyles.theme}
        customStyle={highlighterStyles.customStyle}
        codeTagProps={highlighterStyles.codeTagProps}
        showLineNumbers={false}
        wrapLines={true}
        lineProps={{
          style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' },
        }}
      >
        {code}
      </HighlighterComponent>
    </div>
  )
}

const ExecutableCodeBlock: FC<{
  sqlBlock: SqlBlock
  sqlExecutor: (code: string) => Promise<ExecutionResult>
}> = ({ sqlBlock, sqlExecutor }) => {
  const [result, setResult] = useState<ExecutionResult | null>(null)

  const handleExecute = async () => {
    setResult({ status: 'loading' })
    try {
      const executionResult = await sqlExecutor(sqlBlock.code)
      setResult(executionResult)
    } catch (error) {
      setResult({
        status: 'error',
        message: `実行エラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeActions}>
        <h4 className={styles.codeTitle}>{sqlBlock.title}</h4>
        <button
          type="button"
          className={styles.executeButton}
          onClick={handleExecute}
          disabled={result?.status === 'loading'}
        >
          {result?.status === 'loading' ? (
            <span className={styles.loadingSpinner}>
              <span className={styles.spinner} />
              実行中...
            </span>
          ) : (
            'SQL実行'
          )}
        </button>
      </div>
      <SqlHighlighter code={sqlBlock.code} />

      {result && (
        <div className={styles.executionResult}>
          <div className={styles.resultHeader}>
            実行結果
            <span
              className={`${styles.resultStatus} ${
                result.status === 'success'
                  ? styles.resultStatusSuccess
                  : styles.resultStatusError
              }`}
            >
              {result.status === 'success' ? '成功' : 'エラー'}
            </span>
          </div>
          <div className={styles.resultContent}>
            {result.status === 'error' ? (
              <div className={styles.resultMessage}>{result.message}</div>
            ) : result.data && result.data.length > 0 ? (
              <div>
                <div className={styles.resultTableSection}>
                  <table className={styles.resultTable}>
                    <thead>
                      <tr>
                        {Object.keys(result.data[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.map((row) => {
                        const rowId = JSON.stringify(row)
                        return (
                          <tr key={`data-row-${rowId}`}>
                            {Object.entries(row).map(([key, value]) => (
                              <td key={`${key}-${rowId}`}>
                                {String(value ?? '')}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className={styles.resultMessage}>{result.message}</div>
                </div>

                {result.explainData && result.explainData.length > 0 && (
                  <div>
                    <h5 className={styles.explainTitle}>実行計画 (EXPLAIN)</h5>
                    <div className={styles.resultTableSection}>
                      <table className={styles.resultTable}>
                        <thead>
                          <tr>
                            {Object.keys(result.explainData[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.explainData.map((row) => {
                            const rowId = JSON.stringify(row)
                            return (
                              <tr key={`explain-row-${rowId}`}>
                                {Object.entries(row).map(([key, value]) => (
                                  <td key={`explain-${key}-${rowId}`}>
                                    {String(value ?? 'NULL')}
                                  </td>
                                ))}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.resultMessage}>
                {result.message ||
                  (result.rowsAffected !== undefined
                    ? `${result.rowsAffected} rows affected`
                    : 'Query executed successfully')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const BRD: FC<BRDProps> = ({
  schema,
  errors,
  businessRequirements,
  sqlExecutor,
  versionInfo,
  schemaData,
  ddl,
  reviewComments,
}) => {
  return (
    <div className={styles.container}>
      <TabsRoot defaultValue="erd" className={styles.tabsRoot}>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="erd" className={styles.tabsTrigger}>
            ERD
          </TabsTrigger>
          <TabsTrigger value="migrations" className={styles.tabsTrigger}>
            Migrations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="erd" className={styles.tabsContent}>
          <RelatedSchema key="all-tabels" schema={schemaData.current} />
        </TabsContent>
        <TabsContent value="migrations" className={styles.tabsContent}>
          <MigrationsViewer ddl={ddl} reviewComments={reviewComments} />
        </TabsContent>
      </TabsRoot>

      <div className={styles.brdList}>
        {businessRequirements.map((br) => (
          <div key={br.id} className={styles.brdSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionId}>{br.id}</span>
              {br.title}
            </h2>

            <div className={styles.sectionBody}>
              <div className={styles.overviewSection}>
                {br.overview.map((text, textIndex) => (
                  <p
                    key={`overview-${br.id}-${textIndex}`}
                    className={styles.overviewText}
                  >
                    {text}
                  </p>
                ))}
              </div>

              <div>
                <h3 className={styles.subsectionTitle}>関連テーブル</h3>
                <div className={styles.relatedTables}>
                  <RelatedSchema
                    key={`related-tabels-${br.id}`}
                    schema={br.relatedSchema}
                  />
                </div>
              </div>

              <div>
                <h3 className={styles.subsectionTitle}>想定ユースケース</h3>
                <div className={styles.usecaseList}>
                  {br.useCases.map((useCase) => (
                    <div key={useCase.id} className={styles.usecaseSection}>
                      <h4 className={styles.usecaseTitle}>
                        <span className={styles.usecaseId}>{useCase.id}</span>
                        {useCase.title}
                      </h4>

                      <div className={styles.usecaseContent}>
                        {useCase.steps && (
                          <ol className={styles.stepList}>
                            {useCase.steps.map((step, stepIndex) => (
                              <li
                                key={`step-${useCase.id}-${stepIndex}`}
                                className={styles.stepItem}
                              >
                                <span className={styles.stepNumber}>
                                  {stepIndex + 1}
                                </span>
                                <div className={styles.stepContent}>
                                  {step.split('\n').map((line, lineIndex) => (
                                    <div
                                      key={`line-${useCase.id}-${stepIndex}-${lineIndex}`}
                                    >
                                      {line}
                                    </div>
                                  ))}
                                </div>
                              </li>
                            ))}
                          </ol>
                        )}

                        {useCase.sqlBlocks?.map((sqlBlock, sqlIndex) => (
                          <ExecutableCodeBlock
                            key={`sql-${useCase.id}-${sqlIndex}`}
                            sqlBlock={sqlBlock}
                            sqlExecutor={sqlExecutor}
                          />
                        ))}

                        {useCase.additionalSteps && (
                          <ol
                            className={styles.stepList}
                            start={(useCase.steps?.length ?? 0) + 1}
                          >
                            {useCase.additionalSteps.map(
                              (step, additionalIndex) => (
                                <li
                                  key={`additional-${useCase.id}-${additionalIndex}`}
                                  className={styles.stepItem}
                                >
                                  <span className={styles.stepNumber}>
                                    {(useCase.steps?.length ?? 0) +
                                      additionalIndex +
                                      1}
                                  </span>
                                  <div className={styles.stepContent}>
                                    {step}
                                  </div>
                                </li>
                              ),
                            )}
                          </ol>
                        )}

                        {useCase.bullets && (
                          <ul className={styles.bulletList}>
                            {useCase.bullets.map((bullet, bulletIndex) => (
                              <li
                                key={`bullet-${useCase.id}-${bulletIndex}`}
                                className={styles.bulletItem}
                              >
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
