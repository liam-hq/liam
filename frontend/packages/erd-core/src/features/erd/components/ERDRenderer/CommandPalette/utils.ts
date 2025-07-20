export const getTableLinkHref = (activeTableName: string) => {
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('active', activeTableName)
  return `?${searchParams.toString()}`
}
