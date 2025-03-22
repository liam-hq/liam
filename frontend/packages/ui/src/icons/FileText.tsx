import { FileText as PrimitiveFileText } from 'lucide-react'
import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<typeof PrimitiveFileText>

export const FileText: FC<Props> = (props) => (
  <PrimitiveFileText strokeWidth={1.5} {...props} />
)
