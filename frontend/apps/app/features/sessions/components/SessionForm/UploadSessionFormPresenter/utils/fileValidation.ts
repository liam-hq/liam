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

type FileExtension = 'sql' | 'rb' | 'prisma' | 'json'

const isValidFileExtensionType = (
  extension: string,
): extension is FileExtension => {
  return ['sql', 'rb', 'prisma', 'json'].includes(extension)
}
export const getFileFormat = (fileName: string): FormatType => {
  const extension = getFileExtension(fileName)

  const formatMap: Record<FileExtension, FormatType> = {
    sql: 'postgres',
    rb: 'schemarb',
    prisma: 'prisma',
    json: 'tbls',
  }

  if (extension && isValidFileExtensionType(extension)) {
    return formatMap[extension]
  }
  return 'postgres'
}

// All file extensions that are accepted for upload
const ACCEPTED_FILE_EXTENSIONS = [
  'sql',
  'rb',
  'prisma',
  'json', // tbls format
] as const

export const isValidFileExtension = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return ACCEPTED_FILE_EXTENSIONS.some((ext) => ext === extension)
}
