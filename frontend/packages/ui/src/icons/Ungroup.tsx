import { Ungroup as PrimitiveUngroup } from 'lucide-react'
import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<typeof PrimitiveUngroup>

export const Ungroup: FC<Props> = (props) => (
  <PrimitiveUngroup strokeWidth={1.5} {...props} />
)
