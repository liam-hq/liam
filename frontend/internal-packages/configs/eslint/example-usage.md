# no-unescaped-curly-in-template ESLint Rule

This custom ESLint rule detects unescaped curly braces in template literals, which is especially useful for LangChain templates and other template systems that require literal braces to be escaped.

## Examples

### ❌ Incorrect (will trigger errors)

```typescript
// Unescaped braces in template literal
const template = `Hello {name}!`

// Mixed unescaped braces
const prompt = `User {user} likes {hobby}`
```

### ✅ Correct

```typescript
// Properly escaped braces for literal braces
const template = `Hello {{name}}!`

// Template interpolation (${...}) is allowed
const template = `Hello ${userName}!`

// Mixed: interpolation + escaped literals
const langchainPrompt = `
User input: ${userMessage}

Example format:
{{
  "response": "{{your response here}}"
}}
`
```

## Rule Configuration

The rule is automatically enabled in the base ESLint configuration:

```javascript
rules: {
  'no-unescaped-curly-in-template/no-unescaped-curly-in-template': 'error'
}
```

## Auto-fix

The rule provides automatic fixes that double unescaped braces:
- `{` becomes `{{`
- `}` becomes `}}`

## Background

This rule was created to prevent LangChain template parsing errors like:
```
Error: Single '}' in template.
```

LangChain templates require literal braces to be escaped by doubling them, while template interpolation (`${...}`) should remain single braces.