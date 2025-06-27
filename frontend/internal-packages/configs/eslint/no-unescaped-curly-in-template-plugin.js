/**
 * ESLint plugin to detect unescaped curly braces in template literals
 * @fileoverview Plugin to ensure template literals use doubled braces for literal braces (e.g., LangChain templates)
 */

export const noUnescapedCurlyInTemplatePlugin = {
  meta: {
    name: 'no-unescaped-curly-in-template',
    version: '1.0.0',
  },
  rules: {
    'no-unescaped-curly-in-template': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow unescaped curly braces in template literals',
          category: 'Possible Errors',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          unescapedOpenBrace: 'Unescaped "{" found in template literal. Use "{{" for literal braces or "${...}" for interpolation.',
          unescapedCloseBrace: 'Unescaped "}" found in template literal. Use "}}" for literal braces or "${...}" for interpolation.',
        },
      },

      create(context) {
        function findUnescapedBraces(text) {
          const issues = []
          let i = 0
          
          while (i < text.length) {
            const char = text[i]
            
            if (char === '{') {
              // Check if it's part of ${...} interpolation
              if (i > 0 && text[i - 1] === '$') {
                // This is interpolation, find the closing brace and skip
                let braceCount = 1
                let j = i + 1
                while (j < text.length && braceCount > 0) {
                  if (text[j] === '{') braceCount++
                  else if (text[j] === '}') braceCount--
                  j++
                }
                i = j
                continue
              }
              
              // Check if it's already escaped (double brace)
              if (i + 1 < text.length && text[i + 1] === '{') {
                i += 2 // Skip the escaped pair
                continue
              }
              
              // This is an unescaped opening brace
              issues.push({
                type: 'open',
                index: i,
                char: '{'
              })
            } else if (char === '}') {
              // Check if it's already escaped (double brace)
              if (i > 0 && text[i - 1] === '}') {
                i++
                continue
              }
              
              // Check if it's part of interpolation closure - this should be handled by the opening brace logic
              // If we reach here, it might be an unmatched closing brace
              issues.push({
                type: 'close',
                index: i,
                char: '}'
              })
            }
            
            i++
          }
          
          return issues
        }

        return {
          TemplateLiteral(node) {
            node.quasis.forEach((quasi, quasiIndex) => {
              const text = quasi.value.raw
              const issues = findUnescapedBraces(text)
              
              issues.forEach(issue => {
                const messageId = issue.type === 'open' ? 'unescapedOpenBrace' : 'unescapedCloseBrace'
                
                context.report({
                  node: quasi,
                  messageId,
                  fix(fixer) {
                    // Calculate the actual position in the source code
                    const sourceCode = context.getSourceCode()
                    const quasiStart = quasi.start
                    const issuePosition = quasiStart + 1 + issue.index // +1 for the opening backtick/quote
                    
                    // Create the fix by doubling the brace
                    const replacement = issue.char + issue.char
                    
                    return fixer.replaceTextRange(
                      [issuePosition, issuePosition + 1],
                      replacement
                    )
                  }
                })
              })
            })
          }
        }
      },
    },
  },
}