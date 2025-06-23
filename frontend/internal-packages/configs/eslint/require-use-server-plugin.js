/**
 * ESLint plugin to enforce 'use server' directive in Server Actions files
 * @fileoverview Plugin to ensure Server Actions files start with 'use server' directive
 */

import path from 'path'

export const requireUseServerPlugin = {
  meta: {
    name: 'require-use-server',
    version: '1.0.0',
  },
  rules: {
    'require-use-server': {
      meta: {
        type: 'problem',
        docs: {
          description: "Enforce 'use server' directive in Server Actions files",
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          missingUseServer: "Server action files must start with 'use server' directive",
          useServerNotFirst: "'use server' directive must be the first statement in the file",
        },
      },

      create(context) {
        const filename = context.getFilename()
        
        function isServerActionFile(filename) {
          const normalizedPath = path.normalize(filename).replace(/\\/g, '/')
          return normalizedPath.includes('/actions/') && filename.endsWith('.ts')
        }

        function hasUseServerDirective(body) {
          if (body.length === 0) return false
          
          const firstStatement = body[0]
          return (
            firstStatement.type === 'ExpressionStatement' &&
            firstStatement.expression.type === 'Literal' &&
            firstStatement.expression.value === 'use server'
          )
        }

        function findUseServerDirective(body) {
          for (let i = 0; i < body.length; i++) {
            const statement = body[i]
            if (
              statement.type === 'ExpressionStatement' &&
              statement.expression.type === 'Literal' &&
              statement.expression.value === 'use server'
            ) {
              return i
            }
          }
          return -1
        }

        return {
          Program(node) {
            if (!isServerActionFile(filename)) {
              return
            }

            const { body } = node
            const useServerIndex = findUseServerDirective(body)

            if (useServerIndex === -1) {
              context.report({
                node,
                messageId: 'missingUseServer',
                fix(fixer) {
                  const sourceCode = context.getSourceCode()
                  const firstToken = sourceCode.getFirstToken(node)
                  
                  if (firstToken) {
                    return fixer.insertTextBefore(firstToken, "'use server'\n\n")
                  }
                  return null
                },
              })
            } else if (useServerIndex !== 0) {
              const useServerStatement = body[useServerIndex]
              context.report({
                node: useServerStatement,
                messageId: 'useServerNotFirst',
                fix(fixer) {
                  const sourceCode = context.getSourceCode()
                  const useServerText = sourceCode.getText(useServerStatement)
                  const firstToken = sourceCode.getFirstToken(node)
                  
                  if (firstToken) {
                    return [
                      fixer.remove(useServerStatement),
                      fixer.insertTextBefore(firstToken, `${useServerText}\n\n`)
                    ]
                  }
                  return null
                },
              })
            }
          },
        }
      },
    },
  },
}
