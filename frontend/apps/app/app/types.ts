import type { ReactNode } from 'react'

// https://nextjs.org/docs/app/api-reference/file-conventions/page
export type PageProps = {
  params: Promise<{ [key: string]: string | string[] | undefined }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

//https://nextjs.org/docs/app/api-reference/file-conventions/layout
export type LayoutProps = {
  children?: ReactNode
  params: Promise<{ [key: string]: string | string[] | undefined }>
}
