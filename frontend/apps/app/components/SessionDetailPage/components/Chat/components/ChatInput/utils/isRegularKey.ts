export function isRegularKey(key: string): boolean {
  return /^[a-zA-Z0-9-_]$/.test(key)
}
