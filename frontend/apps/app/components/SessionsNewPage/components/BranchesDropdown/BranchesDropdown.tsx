'use client'

import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components'
import { ChevronsUpDown } from '@/icons'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import styles from './BranchesDropdown.module.css'

type Branch = {
  name: string
  protected: boolean
}

const BranchesResponseSchema = v.array(
  v.object({
    name: v.string(),
    protected: v.boolean(),
  }),
)

const CommitResponseSchema = v.object({
  sha: v.string(),
  date: v.string(),
  message: v.string(),
  author: v.string(),
})

type Props = {
  name?: string
  gitShaName?: string
}

export const BranchesDropdown: FC<Props> = ({
  name = 'branchName',
  gitShaName = 'gitSha',
}) => {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedBranchName, setSelectedBranchName] = useState<string>('')
  const [selectedGitSha, setSelectedGitSha] = useState<string>('')

  const fetchAndSelectBranch = useCallback(async (branchName: string) => {
    if (!selectedProjectId) return
    
    try {
      const response = await fetch(
        `/api/projects/${selectedProjectId}/branches/${branchName}/commit`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch commit SHA')
      }
      const data = await response.json()
      const result = v.safeParse(CommitResponseSchema, data)
      if (result.success) {
        setSelectedBranchName(branchName)
        setSelectedGitSha(result.output.sha)
      }
    } catch (error) {
      console.error('Error fetching commit SHA:', error)
      // Fallback to just the branch name without SHA
      setSelectedBranchName(branchName)
      setSelectedGitSha('')
    }
  }, [selectedProjectId])

  const selectDefaultBranch = useCallback(async (branches: Branch[]) => {
    if (!selectedBranchName && branches.length > 0) {
      const mainBranch = branches.find((b) => b.name === 'main') || branches[0]
      await fetchAndSelectBranch(mainBranch.name)
    }
  }, [selectedBranchName, fetchAndSelectBranch])

  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedProjectId) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/branches`)
        if (!response.ok) {
          throw new Error('Failed to fetch branches')
        }
        const data = await response.json()
        const result = v.safeParse(BranchesResponseSchema, data)
        if (result.success) {
          setBranches(result.output)
          await selectDefaultBranch(result.output)
        }
      } catch (error) {
        console.error('Error fetching branches:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedProjectId) {
      fetchBranches()
    }
  }, [selectedProjectId, selectDefaultBranch])

  const handleChangeBranch = (branchName: string) => {
    fetchAndSelectBranch(branchName)
  }

  // Listen for project changes from form
  useEffect(() => {
    const form = document.querySelector('form')
    if (!form) return

    const handleProjectChange = () => {
      const formData = new FormData(form)
      const projectId = formData.get('projectId') as string
      if (projectId !== selectedProjectId) {
        setSelectedProjectId(projectId || null)
        setSelectedBranchName('')
        setSelectedGitSha('')
        setBranches([])
      }
    }

    const observer = new MutationObserver(handleProjectChange)
    observer.observe(form, { childList: true, subtree: true, attributes: true })
    
    // Initial check
    handleProjectChange()

    return () => observer.disconnect()
  }, [selectedProjectId])

  const selectedBranch = branches.find((b) => b.name === selectedBranchName)

  if (!selectedProjectId) {
    return null
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger className={styles.trigger}>
        <div className={styles.nameAndTag}>
          <span className={styles.name}>
            {selectedBranch?.name || selectedBranchName || 'Select Branch'}
          </span>
          {selectedBranch?.protected && (
            <span className={styles.tag}>production</span>
          )}
        </div>
        <ChevronsUpDown className={styles.chevronIcon} />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="start" className={styles.content}>
          <DropdownMenuRadioGroup
            value={selectedBranchName}
            onValueChange={handleChangeBranch}
          >
            {isLoading ? (
              <DropdownMenuRadioItem value="" label="Loading..." disabled />
            ) : (
              branches
                .sort((a, b) => {
                  // If a is selected, it comes first
                  if (a.name === selectedBranchName) return -1
                  // If b is selected, it comes first
                  if (b.name === selectedBranchName) return 1
                  // Otherwise, maintain original order
                  return 0
                })
                .map(({ name }) => (
                  <DropdownMenuRadioItem
                    key={name}
                    value={name}
                    label={name}
                    className={styles.radioItem}
                  />
                ))
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
      <input
        type="hidden"
        name={name}
        value={selectedBranchName}
      />
      <input
        type="hidden"
        name={gitShaName}
        value={selectedGitSha}
      />
    </DropdownMenuRoot>
  )
}