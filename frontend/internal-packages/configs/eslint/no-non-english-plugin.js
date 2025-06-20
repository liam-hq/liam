export const noNonEnglishPlugin = {
  meta: {
    name: 'no-non-english',
    version: '1.0.0',
  },
  rules: {
    'no-non-english-characters': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow non-English characters in code',
          category: 'Possible Errors',
        },
        fixable: null,
        schema: [],
      },
      create(context) {

        const nonEnglishPattern = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Hangul}\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Thai}\p{Script=Devanagari}]/u

        function checkText(node, text, type) {
          if (nonEnglishPattern.test(text)) {
            const match = text.match(nonEnglishPattern)
            context.report({
              node,
              message: `Non-English character '${match[0]}' found in ${type}. Only English characters are allowed.`,
            })
          }
        }

        return {
          Identifier(node) {
            checkText(node, node.name, 'identifier')
          },

          Literal(node) {
            if (typeof node.value === 'string') {
              checkText(node, node.value, 'string literal')
            }
          },

          TemplateLiteral(node) {
            node.quasis.forEach(quasi => {
              checkText(node, quasi.value.raw, 'template literal')
            })
          },

          Program(node) {
            const sourceCode = context.getSourceCode()
            const comments = sourceCode.getAllComments()
            
            comments.forEach(comment => {
              checkText(comment, comment.value, 'comment')
            })
          },
        }
      },
    },
  },
}
