/**
 * Test file for no-unescaped-curly-in-template ESLint rule
 */

import { ESLint } from 'eslint'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create test ESLint instance with just our rule
const eslint = new ESLint({
  baseConfig: {
    plugins: {
      'no-unescaped-curly-in-template': await import('./no-unescaped-curly-in-template-plugin.js').then(m => m.noUnescapedCurlyInTemplatePlugin)
    },
    rules: {
      'no-unescaped-curly-in-template/no-unescaped-curly-in-template': 'error'
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },
  useEslintrc: false
})

// Test cases
const testCases = [
  {
    name: 'Should detect unescaped opening brace',
    code: 'const template = `Hello {name}!`',
    expectedErrors: 1
  },
  {
    name: 'Should detect unescaped closing brace',
    code: 'const template = `Hello world}`',
    expectedErrors: 1
  },
  {
    name: 'Should detect multiple unescaped braces',
    code: 'const template = `{name} said "{message}"`',
    expectedErrors: 4
  },
  {
    name: 'Should NOT error on properly escaped braces',
    code: 'const template = `Hello {{name}}!`',
    expectedErrors: 0
  },
  {
    name: 'Should NOT error on template interpolation',
    code: 'const template = `Hello ${name}!`',
    expectedErrors: 0
  },
  {
    name: 'Should handle mixed cases correctly',
    code: 'const template = `${user} likes {{hobby}} but not {bad}`',
    expectedErrors: 2 // {bad} should be flagged
  },
  {
    name: 'Should handle complex LangChain-style template',
    code: `const prompt = \`You are an AI assistant.

Example JSON:
{{
  "name": "{userName}",
  "task": "{{taskType}}"
}}

User message: \${userMessage}\``,
    expectedErrors: 1 // Only {userName} should be flagged
  }
]

async function runTests() {
  console.log('🧪 Testing no-unescaped-curly-in-template ESLint rule...\n')
  
  let passed = 0
  let failed = 0
  
  for (const testCase of testCases) {
    try {
      const results = await eslint.lintText(testCase.code, { filePath: 'test.js' })
      const errors = results[0].messages.filter(msg => msg.severity === 2)
      
      if (errors.length === testCase.expectedErrors) {
        console.log(`✅ ${testCase.name}`)
        passed++
      } else {
        console.log(`❌ ${testCase.name}`)
        console.log(`   Expected ${testCase.expectedErrors} errors, got ${errors.length}`)
        if (errors.length > 0) {
          errors.forEach(error => {
            console.log(`   - ${error.message}`)
          })
        }
        failed++
      }
    } catch (error) {
      console.log(`💥 ${testCase.name} - Test failed with error: ${error.message}`)
      failed++
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('🎉 All tests passed!')
  }
}

runTests().catch(console.error)