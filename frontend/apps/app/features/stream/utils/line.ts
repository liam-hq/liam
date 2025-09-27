export const line = (event: string, data: unknown) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data)
  return `event:${event}\ndata:${payload}\n\n`
}
