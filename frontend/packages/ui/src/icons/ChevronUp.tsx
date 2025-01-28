import { ChevronUp as PrimitiveChevronUp } from 'lucide-react'
import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<typeof PrimitiveChevronUp>

export const ChevronUp: FC<Props> = (props) => (
  <PrimitiveChevronUp strokeWidth={1.5} {...props} />
)
