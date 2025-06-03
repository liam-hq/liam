import { fileURLToPath } from 'node:url'
import { createBaseConfig } from '../../packages/configs/eslint/index.js'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

const baseConfig = createBaseConfig({
  tsconfigPath: './tsconfig.json',
  gitignorePath,
})

export default baseConfig.map(config => {
  if (config.rules && config.rules['@typescript-eslint/no-unsafe-member-access']) {
    return {
      ...config,
      rules: {
        ...config.rules,
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    }
  }
  return config
})
