export const PATH_PATTERNS = {
  TABLE_BASE: /^\/tables\/([^/]+)$/,
  TABLE_NAME: /^\/tables\/([^/]+)\/name$/,
  TABLE_COMMENT: /^\/tables\/([^/]+)\/comment$/,
} as const
