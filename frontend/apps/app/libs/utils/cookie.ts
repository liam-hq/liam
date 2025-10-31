type CookieOptions = {
  path?: string
  maxAge?: number
}

/**
 * Set a cookie value
 */
export const setCookie = (
  name: string,
  value: string,
  options: CookieOptions = {},
): void => {
  if (typeof document === 'undefined') {
    return
  }

  let cookieString = `${name}=${value}`

  if (options.path) {
    cookieString += `; path=${options.path}`
  }

  if (options.maxAge !== undefined) {
    cookieString += `; max-age=${options.maxAge}`
  }

  // biome-ignore lint/suspicious/noDocumentCookie: This is the cookie utility abstraction layer
  document.cookie = cookieString
}

/**
 * Set a cookie value with JSON serialization
 */
export const setCookieJson = (
  name: string,
  value: unknown,
  options: CookieOptions = {},
): void => {
  setCookie(name, JSON.stringify(value), options)
}
