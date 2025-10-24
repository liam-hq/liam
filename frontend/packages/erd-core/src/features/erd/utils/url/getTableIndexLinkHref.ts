import type { QueryParam } from '../../../../schemas'
import { getTableIndexElementId } from './getTableIndexElementId'

export const getTableIndexLinkHref = (
  activeTableName: string,
  indexName: string,
) => {
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('active' satisfies QueryParam, activeTableName)
  const targetElementId = getTableIndexElementId(activeTableName, indexName)
  return `?${searchParams.toString()}#${targetElementId}`
}
