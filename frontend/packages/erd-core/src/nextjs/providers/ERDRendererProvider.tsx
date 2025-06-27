import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { FC, PropsWithChildren } from 'react'
import { SchemaProvider, type SchemaProviderValue } from '@/stores'
import { UserEditingProvider } from '@/stores/userEditing'

type Props = {
  schema: SchemaProviderValue
  showDiff?: boolean
}

export const ERDRendererProvider: FC<PropsWithChildren<Props>> = ({
  schema,
  showDiff,
  children,
}) => {
  return (
    <NuqsAdapter>
      <UserEditingProvider showDiff={showDiff}>
        <SchemaProvider {...schema}>{children}</SchemaProvider>
      </UserEditingProvider>
    </NuqsAdapter>
  )
}
