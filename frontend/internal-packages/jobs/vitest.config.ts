import dotenv from 'dotenv'
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    globals: true,
    env: dotenv.config({ path: '.env' }).parsed,
  },
})
