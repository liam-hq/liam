// biome-ignore lint/correctness/noNodejsModules: workaround for CommonJS module import
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { getDMMF } = require('@prisma/internals')

export default getDMMF

