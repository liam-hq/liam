'use client'

import React, { useState } from 'react'
import { updateKnowledgeSuggestionContent } from '../../actions/updateKnowledgeSuggestionContent'
import styles from './EditableContent.module.css'

type EditableContentProps = {
  content: string
  suggestionId: number
  className?: string
}

export const EditableContent = ({
  content,
  suggestionId,
  className,
}: EditableContentProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [isSaving, setIsSaving] = useState(false)
  const [savedContent, setSavedContent] = useState(content)

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelClick = () => {
    setEditedContent(savedContent)
    setIsEditing(false)
  }

  const handleSave = async (formData: FormData) => {
    try {
      setIsSaving(true)
      await updateKnowledgeSuggestionContent(formData)
      setSavedContent(editedContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving content:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.sectionTitle}>Content</div>
        {!isEditing && (
          <button
            type="button"
            onClick={handleEditClick}
            className={styles.editButton}
            aria-label="Edit content"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form action={handleSave} className={styles.form}>
          <input type="hidden" name="suggestionId" value={suggestionId} />
          <textarea
            name="content"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className={`${styles.contentTextarea} ${className || ''}`}
            rows={10}
          />
          <div className={styles.actionButtons}>
            <button
              type="button"
              onClick={handleCancelClick}
              className={styles.cancelButton}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <pre className={className}>{savedContent}</pre>
      )}
    </div>
  )
}
