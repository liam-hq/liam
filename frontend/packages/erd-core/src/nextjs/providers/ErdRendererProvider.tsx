import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { FC, PropsWithChildren } from 'react'
import type { ShowMode } from '@/schemas'
import { SchemaProvider, type SchemaProviderValue } from '@/stores'
import { UserEditingProvider } from '@/stores/userEditing'

type Props = {
  schema: SchemaProviderValue
  showDiff?: boolean
  defaultShowMode?: ShowMode
}

export const ErdRendererProvider: FC<PropsWithChildren<Props>> = ({
  schema,
  showDiff,
  defaultShowMode,
  children,
}) => {
  return (
    <NuqsAdapter>
      <UserEditingProvider
        showDiff={showDiff}
        defaultShowMode={defaultShowMode}
      >
        <SchemaProvider {...schema}>{children}</SchemaProvider>
      </UserEditingProvider>
    </NuqsAdapter>
  )
}
