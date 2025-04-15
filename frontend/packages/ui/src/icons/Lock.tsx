import { Lock as PrimitiveLock } from 'lucide-react'
import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<typeof PrimitiveLock>

export const Lock: FC<Props> = (props) => (
  <PrimitiveLock strokeWidth={1.5} {...props} />
)
