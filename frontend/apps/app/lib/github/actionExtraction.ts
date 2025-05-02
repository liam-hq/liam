import { detectLanguage, identifyCodePatterns } from './languageDetection'

/**
 * Represents a code action extracted from a file
 */
export interface CodeAction {
  type: 'function' | 'class' | 'method' | 'pattern' | 'import' | 'other'
  name: string
  description: string
  language: string
  code: string
  filePath: string
  lineStart: number
  lineEnd: number
  patterns: string[]
}

/**
 * Extracts code actions from a file
 * @param filePath Path to the file
 * @param content File content
 * @returns Array of extracted code actions
 */
export async function extractActionsFromFile(
  filePath: string,
  content: string,
): Promise<CodeAction[]> {
  const language = detectLanguage(filePath, content)
  const patterns = identifyCodePatterns(content, language)

  // Based on the language, use different strategies to extract actions
  switch (language) {
    case 'JavaScript':
    case 'TypeScript':
      return extractJavaScriptActions(content, filePath, language, patterns)
    case 'Python':
      return extractPythonActions(content, filePath, language, patterns)
    case 'Java':
      return extractJavaActions(content, filePath, language, patterns)
    case 'Ruby':
      return extractRubyActions(content, filePath, language, patterns)
    case 'Go':
      return extractGoActions(content, filePath, language, patterns)
    // Add more language handlers
    default:
      return extractGenericActions(content, filePath, language, patterns)
  }
}

/**
 * Extracts actions from JavaScript/TypeScript files
 */
function extractJavaScriptActions(
  content: string,
  filePath: string,
  language: string,
  patterns: string[],
): CodeAction[] {
  const actions: CodeAction[] = []

  // Regular expressions for JavaScript/TypeScript constructs
  const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g
  const arrowFunctionRegex =
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g
  const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?/g
  const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g
  const importRegex = /import\s+(?:{[^}]*}|\w+)\s+from\s+['"][^'"]+['"]/g

  // Extract functions
  let match: RegExpExecArray | null = functionRegex.exec(content)
  while (match !== null) {
    const name = match[1]
    const startIndex = match.index
    const lineStart = content.substring(0, startIndex).split('\n').length

    // Find the end of the function
    let braceCount = 0
    let endIndex = startIndex
    let foundOpenBrace = false

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        foundOpenBrace = true
        braceCount++
      } else if (content[i] === '}') {
        braceCount--
        if (foundOpenBrace && braceCount === 0) {
          endIndex = i + 1
          break
        }
      }
    }

    const code = content.substring(startIndex, endIndex)
    const lineEnd = lineStart + code.split('\n').length - 1

    actions.push({
      type: 'function',
      name,
      description: `Function ${name}`,
      language,
      code,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = functionRegex.exec(content)
  }

  // Extract arrow functions
  match = arrowFunctionRegex.exec(content)
  while (match !== null) {
    const name = match[1]
    const startIndex = match.index
    const lineStart = content.substring(0, startIndex).split('\n').length

    // Find the end of the arrow function
    let braceCount = 0
    let endIndex = startIndex
    let foundOpenBrace = false

    // First, find the arrow
    const arrowIndex = content.indexOf('=>', startIndex)

    // Then find the end of the function body
    for (let i = arrowIndex + 2; i < content.length; i++) {
      const char = content[i]
      if (char === '{') {
        foundOpenBrace = true
        braceCount++
      } else if (char === '}') {
        braceCount--
        if (foundOpenBrace && braceCount === 0) {
          endIndex = i + 1
          break
        }
      } else if (!foundOpenBrace && (char === '\n' || char === ';')) {
        // For arrow functions with expression bodies (no braces)
        endIndex = i
        break
      }
    }

    const code = content.substring(startIndex, endIndex)
    const lineEnd = lineStart + code.split('\n').length - 1

    actions.push({
      type: 'function',
      name,
      description: `Arrow function ${name}`,
      language,
      code,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = arrowFunctionRegex.exec(content)
  }

  // Extract classes
  match = classRegex.exec(content)
  while (match !== null) {
    const name = match[1]
    const startIndex = match.index
    const lineStart = content.substring(0, startIndex).split('\n').length

    // Find the end of the class
    let braceCount = 0
    let endIndex = startIndex
    let foundOpenBrace = false

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        foundOpenBrace = true
        braceCount++
      } else if (content[i] === '}') {
        braceCount--
        if (foundOpenBrace && braceCount === 0) {
          endIndex = i + 1
          break
        }
      }
    }

    const classCode = content.substring(startIndex, endIndex)
    const lineEnd = lineStart + classCode.split('\n').length - 1

    actions.push({
      type: 'class',
      name,
      description: `Class ${name}`,
      language,
      code: classCode,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    // Extract methods within the class
    const methodMatches = [...classCode.matchAll(methodRegex)]
    for (const methodMatch of methodMatches) {
      const methodName = methodMatch[1]
      if (methodName === 'constructor') continue // Skip constructor for brevity

      const methodStartIndex = startIndex + methodMatch.index
      const methodLineStart = content
        .substring(0, methodStartIndex)
        .split('\n').length

      // Find the end of the method
      let methodBraceCount = 0
      let methodEndIndex = methodStartIndex
      let methodFoundOpenBrace = false

      for (let i = methodStartIndex; i < endIndex; i++) {
        if (content[i] === '{') {
          methodFoundOpenBrace = true
          methodBraceCount++
        } else if (content[i] === '}') {
          methodBraceCount--
          if (methodFoundOpenBrace && methodBraceCount === 0) {
            methodEndIndex = i + 1
            break
          }
        }
      }

      const methodCode = content.substring(methodStartIndex, methodEndIndex)
      const methodLineEnd = methodLineStart + methodCode.split('\n').length - 1

      actions.push({
        type: 'method',
        name: methodName,
        description: `Method ${methodName} in class ${name}`,
        language,
        code: methodCode,
        filePath,
        lineStart: methodLineStart,
        lineEnd: methodLineEnd,
        patterns,
      })
    }

    match = classRegex.exec(content)
  }

  // Extract imports
  match = importRegex.exec(content)
  while (match !== null) {
    const importStatement = match[0]
    const lineStart = content.substring(0, match.index).split('\n').length
    const lineEnd = lineStart

    actions.push({
      type: 'import',
      name: 'import',
      description: 'Import statement',
      language,
      code: importStatement,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = importRegex.exec(content)
  }

  return actions
}

/**
 * Extracts actions from Python files
 */
function extractPythonActions(
  content: string,
  filePath: string,
  language: string,
  patterns: string[],
): CodeAction[] {
  const actions: CodeAction[] = []
  const lines = content.split('\n')

  // Regular expressions for Python constructs
  const functionRegex = /def\s+(\w+)\s*\(/g
  const classRegex = /class\s+(\w+)(?:\s*\([^)]*\))?:/g
  const importRegex = /(?:from\s+[\w.]+\s+)?import\s+[\w.,\s*]+/g

  // Extract functions
  let match: RegExpExecArray | null = functionRegex.exec(content)
  while (match !== null) {
    const name = match[1]
    const startIndex = match.index
    const lineStart = content.substring(0, startIndex).split('\n').length

    // Find the end of the function by indentation
    const functionLine = content.substring(
      startIndex,
      content.indexOf('\n', startIndex),
    )
    const indentMatch = functionLine.match(/^(\s*)/)
    const baseIndent = indentMatch ? indentMatch[1].length : 0

    let endIndex = content.indexOf('\n', startIndex)
    let currentLine = lineStart + 1

    while (currentLine < lines.length) {
      const line = lines[currentLine]
      const lineIndentMatch = line.match(/^(\s*)/)
      const lineIndent = lineIndentMatch ? lineIndentMatch[1].length : 0

      if (line.trim() === '' || lineIndent > baseIndent) {
        endIndex = content.indexOf('\n', endIndex) + 1
        currentLine++
      } else {
        break
      }
    }

    const code = content.substring(startIndex, endIndex)
    const lineEnd = lineStart + code.split('\n').length - 1

    actions.push({
      type: 'function',
      name,
      description: `Function ${name}`,
      language,
      code,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = functionRegex.exec(content)
  }

  // Extract classes
  match = classRegex.exec(content)
  while (match !== null) {
    const name = match[1]
    const startIndex = match.index
    const lineStart = content.substring(0, startIndex).split('\n').length

    // Find the end of the class by indentation
    const classLine = content.substring(
      startIndex,
      content.indexOf('\n', startIndex),
    )
    const indentMatch = classLine.match(/^(\s*)/)
    const baseIndent = indentMatch ? indentMatch[1].length : 0

    let endIndex = content.indexOf('\n', startIndex)
    let currentLine = lineStart + 1

    while (currentLine < lines.length) {
      const line = lines[currentLine]
      const lineIndentMatch = line.match(/^(\s*)/)
      const lineIndent = lineIndentMatch ? lineIndentMatch[1].length : 0

      if (line.trim() === '' || lineIndent > baseIndent) {
        endIndex = content.indexOf('\n', endIndex) + 1
        currentLine++
      } else {
        break
      }
    }

    const code = content.substring(startIndex, endIndex)
    const lineEnd = lineStart + code.split('\n').length - 1

    actions.push({
      type: 'class',
      name,
      description: `Class ${name}`,
      language,
      code,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = classRegex.exec(content)
  }

  // Extract imports
  match = importRegex.exec(content)
  while (match !== null) {
    const importStatement = match[0]
    const lineStart = content.substring(0, match.index).split('\n').length
    const lineEnd = lineStart

    actions.push({
      type: 'import',
      name: 'import',
      description: 'Import statement',
      language,
      code: importStatement,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = importRegex.exec(content)
  }

  return actions
}

/**
 * Extracts actions from Java files
 */
function extractJavaActions(
  content: string,
  filePath: string,
  language: string,
  patterns: string[],
): CodeAction[] {
  const actions: CodeAction[] = []

  // Regular expressions for Java constructs
  const classRegex =
    /(?:public|private|protected)?\s*class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?/g
  const importRegex = /import\s+[\w.]+(?:\.\*)?;/g

  // Extract classes
  let match: RegExpExecArray | null = classRegex.exec(content)
  while (match !== null) {
    const name = match[1]
    const startIndex = match.index
    const lineStart = content.substring(0, startIndex).split('\n').length

    // Find the end of the class
    let braceCount = 0
    let endIndex = startIndex
    let foundOpenBrace = false

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        foundOpenBrace = true
        braceCount++
      } else if (content[i] === '}') {
        braceCount--
        if (foundOpenBrace && braceCount === 0) {
          endIndex = i + 1
          break
        }
      }
    }

    const classCode = content.substring(startIndex, endIndex)
    const lineEnd = lineStart + classCode.split('\n').length - 1

    actions.push({
      type: 'class',
      name,
      description: `Class ${name}`,
      language,
      code: classCode,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = classRegex.exec(content)
  }

  // Extract imports
  match = importRegex.exec(content)
  while (match !== null) {
    const importStatement = match[0]
    const lineStart = content.substring(0, match.index).split('\n').length
    const lineEnd = lineStart

    actions.push({
      type: 'import',
      name: 'import',
      description: 'Import statement',
      language,
      code: importStatement,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = importRegex.exec(content)
  }

  return actions
}

/**
 * Extracts actions from Ruby files
 */
function extractRubyActions(
  content: string,
  filePath: string,
  language: string,
  patterns: string[],
): CodeAction[] {
  const actions: CodeAction[] = []

  // Regular expressions for Ruby constructs
  const functionRegex = /def\s+(\w+)(?:\s*\([^)]*\))?/g
  const classRegex = /class\s+(\w+)(?:\s*<\s*\w+)?/g

  // Extract functions
  let match: RegExpExecArray | null = functionRegex.exec(content)
  while (match !== null) {
    const name = match[1]
    const startIndex = match.index
    const lineStart = content.substring(0, startIndex).split('\n').length

    // Find the end of the function
    let endIndex = content.indexOf('end', startIndex)
    if (endIndex === -1) endIndex = content.length
    else endIndex += 3 // Include 'end'

    const code = content.substring(startIndex, endIndex)
    const lineEnd = lineStart + code.split('\n').length - 1

    actions.push({
      type: 'function',
      name,
      description: `Function ${name}`,
      language,
      code,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = functionRegex.exec(content)
  }

  // Extract classes
  match = classRegex.exec(content)
  while (match !== null) {
    const name = match[1]
    const startIndex = match.index
    const lineStart = content.substring(0, startIndex).split('\n').length

    // Find the end of the class
    let endIndex = content.indexOf('end', startIndex)
    if (endIndex === -1) endIndex = content.length
    else endIndex += 3 // Include 'end'

    const classCode = content.substring(startIndex, endIndex)
    const lineEnd = lineStart + classCode.split('\n').length - 1

    actions.push({
      type: 'class',
      name,
      description: `Class ${name}`,
      language,
      code: classCode,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = classRegex.exec(content)
  }

  return actions
}

/**
 * Extracts actions from Go files
 */
function extractGoActions(
  content: string,
  filePath: string,
  language: string,
  patterns: string[],
): CodeAction[] {
  const actions: CodeAction[] = []

  // Regular expressions for Go constructs
  const functionRegex = /func\s+(\w+)\s*\([^)]*\)\s*(?:\([^)]*\))?\s*{/g

  // Extract functions
  let match: RegExpExecArray | null = functionRegex.exec(content)
  while (match !== null) {
    const name = match[1]
    const startIndex = match.index
    const lineStart = content.substring(0, startIndex).split('\n').length

    // Find the end of the function
    let braceCount = 0
    let endIndex = startIndex
    let foundOpenBrace = false

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        foundOpenBrace = true
        braceCount++
      } else if (content[i] === '}') {
        braceCount--
        if (foundOpenBrace && braceCount === 0) {
          endIndex = i + 1
          break
        }
      }
    }

    const code = content.substring(startIndex, endIndex)
    const lineEnd = lineStart + code.split('\n').length - 1

    actions.push({
      type: 'function',
      name,
      description: `Function ${name}`,
      language,
      code,
      filePath,
      lineStart,
      lineEnd,
      patterns,
    })

    match = functionRegex.exec(content)
  }

  return actions
}

/**
 * Extracts actions from files in languages without specific extractors
 */
function extractGenericActions(
  content: string,
  filePath: string,
  language: string,
  patterns: string[],
): CodeAction[] {
  const actions: CodeAction[] = []
  const lines = content.split('\n')

  // For languages without specific extractors, we'll use a simple approach
  // to identify potential code blocks based on common patterns

  // Look for potential function/method declarations
  const functionPattern =
    /\b(?:function|def|func|sub|procedure|method)\s+(\w+)/i
  const classPattern = /\b(?:class|struct|interface|trait|record|enum)\s+(\w+)/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for function pattern
    const functionMatch = line.match(functionPattern)
    if (functionMatch) {
      const name = functionMatch[1]
      actions.push({
        type: 'function',
        name,
        description: `Function ${name}`,
        language,
        code: line,
        filePath,
        lineStart: i + 1,
        lineEnd: i + 1,
        patterns,
      })
    }

    // Check for class pattern
    const classMatch = line.match(classPattern)
    if (classMatch) {
      const name = classMatch[1]
      actions.push({
        type: 'class',
        name,
        description: `Class ${name}`,
        language,
        code: line,
        filePath,
        lineStart: i + 1,
        lineEnd: i + 1,
        patterns,
      })
    }
  }

  return actions
}
