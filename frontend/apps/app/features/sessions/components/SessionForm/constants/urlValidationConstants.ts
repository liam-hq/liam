/**
 * Error messages for URL validation (English)
 */
export const URL_VALIDATION_ERROR_MESSAGES = {
  INVALID_URL:
    'Invalid URL. Please provide a valid URL pointing to a schema file (.sql, .rb, .prisma, or .json).',
  DOMAIN_NOT_ALLOWED: 'Domain not allowed. Please use a trusted source.',
  FILE_TOO_LARGE: 'File too large. Maximum allowed size is 5MB.',
  FETCH_TIMEOUT: 'Request timed out. Please try again or check the URL.',
  FETCH_FAILED: 'Failed to fetch schema',
  INVALID_FILE_TYPE:
    'Invalid file type. Supported formats: .sql, .rb, .prisma, .json',
  GENERAL_ERROR: 'An error occurred while fetching the schema',
} as const

/**
 * Error messages for URL validation (Japanese)
 */
/* eslint-disable no-non-english/no-non-english-characters */
export const URL_VALIDATION_ERROR_MESSAGES_JA = {
  INVALID_URL:
    '無効なURLです。スキーマファイル（.sql、.rb、.prisma、または.json）を指す有効なURLを入力してください。',
  DOMAIN_NOT_ALLOWED:
    'このドメインは許可されていません。信頼できるソースを使用してください。',
  FILE_TOO_LARGE: 'ファイルサイズが大きすぎます。最大許可サイズは5MBです。',
  FETCH_TIMEOUT:
    'リクエストがタイムアウトしました。再試行するか、URLを確認してください。',
  FETCH_FAILED: 'スキーマの取得に失敗しました',
  INVALID_FILE_TYPE:
    '無効なファイル形式です。サポートされている形式：.sql、.rb、.prisma、.json',
  GENERAL_ERROR: 'スキーマの取得中にエラーが発生しました',
} as const
