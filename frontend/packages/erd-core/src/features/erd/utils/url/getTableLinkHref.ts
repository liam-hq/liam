import type { QueryParam } from '../../../../schemas'

export const getTableLinkHref = (activeTableName: string) => {
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('active' satisfies QueryParam, activeTableName)
  return `?${searchParams.toString()}`
}
