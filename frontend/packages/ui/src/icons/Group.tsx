import { Group as PrimitiveGroup } from 'lucide-react'
import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<typeof PrimitiveGroup>

export const Group: FC<Props> = (props) => (
  <PrimitiveGroup strokeWidth={1.5} {...props} />
)
