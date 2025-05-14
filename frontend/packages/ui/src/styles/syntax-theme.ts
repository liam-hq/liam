/**
 * Custom syntax highlighting theme using CSS variables
 */

export const syntaxTheme = {
  'code[class*="language-"]': {
    color: 'var(--syntax-text)',
    textShadow: 'none',
  },
  'pre[class*="language-"]': {
    color: 'var(--syntax-text)',
    textShadow: 'none',
    background: 'var(--syntax-background)',
  },
  comment: {
    color: 'var(--syntax-comment)',
  },
  keyword: {
    color: 'var(--syntax-keyword)',
  },
  string: {
    color: 'var(--syntax-string)',
  },
  'attr-name': {
    color: 'var(--syntax-attr-name)',
  },
  function: {
    color: 'var(--syntax-function)',
  },
  'class-name': {
    color: 'var(--syntax-class-name)',
  },
  number: {
    color: 'var(--syntax-number)',
  },
  operator: {
    color: 'var(--syntax-operator)',
  },
  punctuation: {
    color: 'var(--syntax-punctuation)',
  },
}

export const syntaxCustomStyle = {
  background: 'var(--syntax-background)',
  borderRadius: 'var(--syntax-border-radius)',
  padding: 'var(--syntax-padding)',
  fontSize: 'var(--syntax-font-size)',
  marginBottom: 'var(--syntax-margin-bottom)',
}

export const syntaxCodeTagProps = {
  style: {
    fontFamily: 'var(--code-font, monospace)',
    fontSize: 'var(--syntax-font-size)',
    lineHeight: 'var(--syntax-line-height)',
  },
}
