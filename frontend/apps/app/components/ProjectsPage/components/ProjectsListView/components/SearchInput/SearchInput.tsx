'use client'

import { Search } from '@liam-hq/ui'
import type { ChangeEvent, FC, FormEvent } from 'react'
import { useState } from 'react'
import styles from './SearchInput.module.css'

interface SearchInputProps {
  onSearch: (query: string) => void
  loading?: boolean
  placeholder?: string
}

export const SearchInput: FC<SearchInputProps> = ({
  onSearch,
  loading = false,
  placeholder = 'Search Projects...',
}) => {
  const [query, setQuery] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)

    if (newValue === '') {
      onSearch('')
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <div className={styles.searchInput}>
        <Search className={styles.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={loading}
        />
        {loading && <span className={styles.loading}>Loading...</span>}
      </div>
    </form>
  )
}
