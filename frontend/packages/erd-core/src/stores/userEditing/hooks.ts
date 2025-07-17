import { err, ok, type Result } from 'neverthrow'
import { useContext } from 'react'
import { UserEditingContext, type UserEditingContextValue } from './context'

const useUserEditing = (): Result<UserEditingContextValue, Error> => {
  const userEditing = useContext(UserEditingContext)
  if (!userEditing) {
    return err(
      new Error('useUserEditing must be used within a UserEditingProvider'),
    )
  }

  return ok(userEditing)
}

export const useUserEditingOrThrow = (): UserEditingContextValue => {
  const result = useUserEditing()
  if (result.isErr()) {
    throw result.error
  }
  return result.value
}
