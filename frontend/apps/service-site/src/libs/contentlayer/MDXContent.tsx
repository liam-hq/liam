import { Callout } from '@/contents/components'
import {
  Blockquote,
  BodyText,
  Code,
  CodeBlock,
  Heading,
  Image,
  LinkCard,
  LinkText,
  OrderList,
  Table,
  UnOrderList,
} from '@/features/posts'
import type { MDXComponents } from 'mdx/types'
// eslint-disable-next-line no-restricted-imports
import { useMDXComponent } from 'next-contentlayer2/hooks'
import React, { Children, type FC, type ReactElement } from 'react'

const mdxComponents: MDXComponents = {
  h2: ({ children, ...props }) => (
    <Heading as="h2" {...props}>
      {children}
    </Heading>
  ),
  h3: ({ children, ...props }) => (
    <Heading as="h3" {...props}>
      {children}
    </Heading>
  ),
  h4: ({ children, ...props }) => (
    <Heading as="h4" {...props}>
      {children}
    </Heading>
  ),
  h5: ({ children, ...props }) => (
    <Heading as="h5" {...props}>
      {children}
    </Heading>
  ),
  p: ({ children, ...props }) => {
    // Check if children contain a <figure> element
    const hasNestedFigure = Children.toArray(children).some(
      (child) =>
        React.isValidElement(child) &&
        !['blockquote', 'pre'].includes(child.type as string) &&
        child.props.children?.type === 'figure',
    )

    // Use <div> if it contains a <figure>, otherwise use <p>
    return hasNestedFigure ? (
      <div {...props}>{children}</div>
    ) : (
      <BodyText {...props}>{children}</BodyText>
    )
  },
  pre: (props) => {
    const child = Children.only(props.children) as ReactElement

    return (
      <pre {...props}>
        <code>{child.props.children}</code>
      </pre>
    )
  },
  figure: ({ children, ...props }) => (
    <CodeBlock {...props}>{children}</CodeBlock>
  ),
  code: ({ children, ...props }) => <Code {...props}>{children}</Code>,
  LinkCard: (props) => <LinkCard {...props} />,
  Callout: (props) => <Callout {...props} />,
  blockquote: ({ children, ...props }) => {
    return <Blockquote {...props}>{children}</Blockquote>
  },
  ol: ({ children, ...props }) => {
    return <OrderList {...props}>{children}</OrderList>
  },
  ul: ({ children, ...props }) => {
    return <UnOrderList {...props}>{children}</UnOrderList>
  },
  a: ({ href = '#', ...props }) => <LinkText {...props} href={href} />,
  table: ({ children, ...props }) => {
    return <Table {...props}>{children}</Table>
  },
  img: (props) => {
    const { alt = '', src = '', ...restProps } = props
    return <Image alt={alt} src={src} {...restProps} />
  },
}

type Props = {
  code: string
}

export const MDXContent: FC<Props> = ({ code }) => {
  const Content = useMDXComponent(code)

  return <Content components={mdxComponents} />
}
