// https://nextjs.org/docs/app/api-reference/file-conventions/page
export type PageProps = {
  params: Promise<{ [key: string]: string | string[] | undefined }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}
