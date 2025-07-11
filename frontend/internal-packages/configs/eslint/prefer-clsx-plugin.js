export const preferClsxPlugin = {
  meta: {
    name: 'prefer-clsx',
    version: '1.0.0',
  },
  rules: {
    'prefer-clsx-for-classnames': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce using clsx instead of template literals for className attributes',
          category: 'Best Practices',
        },
        fixable: 'code',
        schema: [],
      },
      create(context) {
        function isClassNameAttribute(node) {
          return (
            node.type === 'JSXAttribute' &&
            node.name &&
            node.name.type === 'JSXIdentifier' &&
            node.name.name === 'className'
          )
        }

        function hasTemplateLiteralWithExpressions(node) {
          return (
            node.type === 'TemplateLiteral' &&
            node.expressions.length > 0
          )
        }

        function generateClsxFix(node) {
          const sourceCode = context.getSourceCode()
          const templateLiteral = node.value.expression

          const parts = []
          for (let i = 0; i < templateLiteral.quasis.length; i++) {
            const quasi = templateLiteral.quasis[i]
            const expression = templateLiteral.expressions[i]

            if (quasi.value.cooked.trim()) {
              parts.push(`'${quasi.value.cooked.trim()}'`)
            }

            if (expression) {
              parts.push(sourceCode.getText(expression))
            }
          }

          const filteredParts = parts.filter(part => part !== "''")
          return `clsx(${filteredParts.join(', ')})`
        }

        return {
          JSXAttribute(node) {
            if (!isClassNameAttribute(node)) {
              return
            }

            if (
              node.value &&
              node.value.type === 'JSXExpressionContainer' &&
              hasTemplateLiteralWithExpressions(node.value.expression)
            ) {
              context.report({
                node: node.value.expression,
                message: 'Use clsx() instead of template literals for className concatenation. Template literals make it harder to conditionally apply classes and are less readable.',
                fix(fixer) {
                  const clsxCall = generateClsxFix(node)
                  return fixer.replaceText(node.value.expression, clsxCall)
                },
              })
            }
          },
        }
      },
    },
  },
}
