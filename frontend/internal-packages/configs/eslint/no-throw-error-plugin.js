export const noThrowErrorPlugin = {
  meta: {
    name: 'no-throw-error',
    version: '1.0.0',
  },
  rules: {
    'no-throw-error': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow throw new Error statements, use neverthrow Result types instead',
          category: 'Best Practices',
        },
        fixable: null,
        schema: [],
      },
      create(context) {
        return {
          ThrowStatement(node) {
            if (
              node.argument &&
              node.argument.type === 'NewExpression' &&
              node.argument.callee &&
              node.argument.callee.type === 'Identifier' &&
              node.argument.callee.name === 'Error'
            ) {
              context.report({
                node,
                message: 'Use neverthrow Result types (err, ok, ResultAsync) instead of throwing Error. Import from "neverthrow".',
              })
            }
          },
        }
      },
    },
  },
}
