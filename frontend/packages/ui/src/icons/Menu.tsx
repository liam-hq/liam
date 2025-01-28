import { Menu as PrimitiveMenu } from 'lucide-react'
import type { ComponentPropsWithoutRef, FC } from 'react'

type Props = ComponentPropsWithoutRef<typeof PrimitiveMenu>

export const Menu: FC<Props> = (props) => (
  <PrimitiveMenu strokeWidth={1.5} {...props} />
)
