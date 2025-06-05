'use client'

import { ArrowRight, Button } from '@liam-hq/ui'
import { useRouter } from 'next/navigation'
import type { ChangeEvent, FC, FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as v from 'valibot'
import { ProjectsDropdown } from './components/ProjectsDropdown'
import { BranchesDropdown } from './components/BranchesDropdown'
import styles from './SessionsNewPage.module.css'

const ApiSessionsCreateSchema = v.object({
  success: v.boolean(),
  designSession: v.object({
    id: v.string(),
  }),
})

export const SessionsNewPage: FC = () => {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [instructions, setInstructions] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasContent = instructions.trim().length > 0

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInstructions(value)

    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const createSession = useCallback(async (formData: FormData) => {
    const requestBody: {
      projectId?: string
      gitSha?: string
    } = {}

    const projectId = formData.get('projectId') as string
    const gitSha = formData.get('gitSha') as string

    if (projectId) {
      requestBody.projectId = projectId
    }

    if (gitSha) {
      requestBody.gitSha = gitSha
    }

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error('Failed to create session')
    }

    const data = await response.json()
    const result = v.safeParse(ApiSessionsCreateSchema, data)

    if (!result.success) {
      throw new Error('Invalid response format')
    }

    if (!result.output.success) {
      throw new Error('Session creation failed')
    }

    return result.output.designSession
  }, [])

  // TODO: Implement page navigation with initial message handling
  // When navigating to the session page, the initial message should be sent
  // to start the chat conversation automatically

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!hasContent || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      const session = await createSession(formData)

      router.push(`/app/design_sessions/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>What can I help you Database Design?</h1>
        <div className={styles.formContainer}>
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className={styles.projectSelectionContainer}>
              <ProjectsDropdown />
              <BranchesDropdown />
            </div>
            <div className={styles.formContent}>
              <div className={styles.formGroup}>
                <div className={styles.inputWrapper}>
                  <textarea
                    id="instructions"
                    ref={textareaRef}
                    value={instructions}
                    onChange={handleChange}
                    placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
                    disabled={isLoading}
                    className={styles.textarea}
                    rows={6}
                    aria-label="Database design instructions"
                  />
                  {error && <p className={styles.error}>{error}</p>}
                </div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.buttonContainer}>
              <Button
                type="submit"
                variant="solid-primary"
                disabled={!hasContent || isLoading}
                isLoading={isLoading}
                className={styles.buttonCustom}
                loadingIndicatorType="content"
              >
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
