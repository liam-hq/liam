import type { FormatType } from '@/components/FormatIcon/FormatIcon'

const getFileExtension = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') {
    return ''
  }

  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex > 0 && lastDotIndex < fileName.length - 1) {
    return fileName.slice(lastDotIndex + 1).toLowerCase()
  }

  return ''
}

export const getFileFormat = (fileName: string): FormatType => {
  const extension = getFileExtension(fileName)

  const formatMap: Record<string, FormatType> = {
    sql: 'postgres',
    rb: 'schemarb',
    prisma: 'prisma',
    json: 'tbls',
  }

  return formatMap[extension] || 'postgres'
}

export const getDisplayFormat = (fileName: string): string => {
  const extension = getFileExtension(fileName)

  const displayMap: Record<string, string> = {
    sql: 'postgresql',
    rb: 'ruby',
    prisma: 'prisma',
    json: 'tbls',
  }

  return displayMap[extension] || 'postgresql'
}

// All file extensions that are accepted for upload
const ACCEPTED_FILE_EXTENSIONS = [
  'sql',
  'rb',
  'prisma',
  'json', // tbls format
] as const
type AcceptedExtension = (typeof ACCEPTED_FILE_EXTENSIONS)[number]

export const isValidFileExtension = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return ACCEPTED_FILE_EXTENSIONS.some((ext) => ext === extension)
}
