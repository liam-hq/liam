import { ChevronLeft as PrimitiveChevronLeft } from 'lucide-react'
import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<typeof PrimitiveChevronLeft>

export const ChevronLeft: FC<Props> = (props) => (
  <PrimitiveChevronLeft strokeWidth={1.5} {...props} />
)
