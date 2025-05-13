'use client'

import type { Tables } from '@liam-hq/db/supabase/database.types'
import { useState } from 'react'

type SearchResult = {
  projects: Tables<'projects'>[] | null
  loading: boolean
  error: Error | null
}

export const useProjectSearch = (
  organizationId?: string,
  initialProjects?: Tables<'projects'>[] | null,
) => {
  const [searchResult, setSearchResult] = useState<SearchResult>({
    projects: initialProjects || null,
    loading: false,
    error: null,
  })
  const [searchQuery, setSearchQuery] = useState('')

  const searchProjects = async (query: string) => {
    setSearchQuery(query)
    setSearchResult((prev) => ({ ...prev, loading: true }))

    if (!query.trim()) {
      setSearchResult({
        projects: initialProjects || null,
        loading: false,
        error: null,
      })
      return
    }

    try {
      const searchPath = `/api/projects/search?query=${encodeURIComponent(
        query,
      )}${organizationId ? `&organizationId=${organizationId}` : ''}`

      const response = await fetch(searchPath)
      if (!response.ok) {
        throw new Error('Failed to search projects')
      }

      const data = await response.json()
      setSearchResult({
        projects: data,
        loading: false,
        error: null,
      })
    } catch (error) {
      setSearchResult({
        projects: null,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  return {
    searchResult,
    searchQuery,
    searchProjects,
  }
}
