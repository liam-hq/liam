import { extname } from 'node:path'

/**
 * Map of file extensions to programming languages
 * This mapping helps identify the language of a file based on its extension
 */
const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript and TypeScript
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',

  // Web
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'Sass',
  '.less': 'Less',

  // Python
  '.py': 'Python',
  '.pyw': 'Python',
  '.ipynb': 'Jupyter Notebook',

  // Ruby
  '.rb': 'Ruby',
  '.erb': 'Ruby',
  '.rake': 'Ruby',

  // Java
  '.java': 'Java',
  '.class': 'Java',
  '.jar': 'Java',

  // C/C++
  '.c': 'C',
  '.h': 'C',
  '.cpp': 'C++',
  '.hpp': 'C++',
  '.cc': 'C++',

  // C#
  '.cs': 'C#',
  '.csx': 'C#',

  // Go
  '.go': 'Go',

  // Rust
  '.rs': 'Rust',

  // PHP
  '.php': 'PHP',

  // Swift
  '.swift': 'Swift',

  // Kotlin
  '.kt': 'Kotlin',
  '.kts': 'Kotlin',

  // Shell
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',

  // Data formats
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.xml': 'XML',
  '.csv': 'CSV',

  // Other
  '.md': 'Markdown',
  '.sql': 'SQL',
  '.graphql': 'GraphQL',
  '.proto': 'Protocol Buffers',
}

/**
 * Detects the programming language of a file based on its extension and content
 * @param filePath Path to the file
 * @param content Optional file content for more sophisticated detection
 * @returns Detected language name
 */
export function detectLanguage(filePath: string, content?: string): string {
  const extension = extname(filePath).toLowerCase()

  // First try to detect by extension
  if (extension in LANGUAGE_MAP) {
    return LANGUAGE_MAP[extension]
  }

  // If extension is not recognized and content is provided,
  // we could implement more sophisticated detection based on content patterns
  if (content) {
    // Check for shebang in scripts
    if (content.startsWith('#!/usr/bin/env node')) {
      return 'JavaScript'
    }
    if (content.startsWith('#!/usr/bin/env python')) {
      return 'Python'
    }
    if (content.startsWith('#!/usr/bin/env ruby')) {
      return 'Ruby'
    }

    // Check for language-specific patterns
    if (
      content.includes('import React') ||
      content.includes('export default')
    ) {
      return 'JavaScript'
    }
    if (content.includes('def __init__') || content.includes('import numpy')) {
      return 'Python'
    }
    if (
      content.includes('public class') &&
      content.includes('public static void main')
    ) {
      return 'Java'
    }
  }

  return 'Unknown'
}

/**
 * Identifies common programming patterns in code
 * @param content Code content
 * @param language Detected language
 * @returns Array of identified patterns
 */
export function identifyCodePatterns(
  content: string,
  language: string,
): string[] {
  const patterns: string[] = []

  // Common patterns across languages
  if (content.includes('try') && content.includes('catch')) {
    patterns.push('error-handling')
  }

  if (content.includes('async') && content.includes('await')) {
    patterns.push('async-await')
  }

  // Language-specific patterns
  switch (language) {
    case 'JavaScript':
    case 'TypeScript':
      if (content.includes('useState') || content.includes('useEffect')) {
        patterns.push('react-hooks')
      }
      if (content.includes('import') && content.includes('from')) {
        patterns.push('es-modules')
      }
      if (content.includes('class') && content.includes('extends')) {
        patterns.push('class-inheritance')
      }
      break

    case 'Python':
      if (content.includes('def __init__')) {
        patterns.push('class-constructor')
      }
      if (content.includes('with') && content.includes('as')) {
        patterns.push('context-manager')
      }
      if (
        content.includes('import pandas') ||
        content.includes('import numpy')
      ) {
        patterns.push('data-science')
      }
      break

    case 'Java':
      if (content.includes('public class') && content.includes('extends')) {
        patterns.push('inheritance')
      }
      if (content.includes('@Override')) {
        patterns.push('method-override')
      }
      if (content.includes('implements')) {
        patterns.push('interface-implementation')
      }
      break

    // Add more language-specific patterns as needed
  }

  return patterns
}
