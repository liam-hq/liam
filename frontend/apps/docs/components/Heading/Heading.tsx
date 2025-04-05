// biome-ignore lint/nursery/noRestrictedImports: Make original Heading component
import { Heading as FumadocsHeading } from 'fumadocs-ui/components/heading'
import type { ComponentProps, FC } from 'react'
import { wrapperStyle } from "./Heading.style"

type Props = ComponentProps<typeof FumadocsHeading>

export const Heading: FC<Props> = ({ as, ...props }) => {
  return <FumadocsHeading {...props} as={as} className={wrapperStyle({ as })} />
}
