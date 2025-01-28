import { Ellipsis as PrimitiveEllipsis } from 'lucide-react'
import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<typeof PrimitiveEllipsis>

export const Ellipsis: FC<Props> = (props) => (
  <PrimitiveEllipsis strokeWidth={1.5} {...props} />
)
