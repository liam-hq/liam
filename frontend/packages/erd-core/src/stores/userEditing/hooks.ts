import { useContext } from 'react'
import { UserEditingContext } from './context'

export const useUserEditing = () => {
  const userEditing = useContext(UserEditingContext)
  if (!userEditing) {
    throw new Error('useUserEditing must be used within a UserEditingProvider')
  }

  return userEditing
}
