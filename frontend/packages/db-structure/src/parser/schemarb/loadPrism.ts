// biome-ignore lint/correctness/noNodejsModules: this is needed
import { promises as fsPromises } from 'node:fs'
// biome-ignore lint/correctness/noNodejsModules: this is needed
import { readFile } from 'node:fs/promises'
// biome-ignore lint/correctness/noNodejsModules: this is needed
import { fileURLToPath } from 'node:url'
// biome-ignore lint/correctness/noNodejsModules: this is needed
import { WASI } from 'node:wasi'
import type { ParseResult } from '@ruby/prism/src/deserialize.js'
import { parsePrism } from '@ruby/prism/src/parsePrism.js'

export async function loadPrism(): Promise<(source: string) => ParseResult> {
  const local = fileURLToPath(
    new URL(
      '../../../node_modules/@ruby/prism/src/prism.wasm',
      import.meta.url,
    ),
  )
  let bool = false
  try {
    await fsPromises.stat(local)
    bool = true
  } catch (_e) {}
  const path = bool
    ? local
    : fileURLToPath(new URL('prism.wasm', import.meta.url))
  console.error(path)

  const wasm = await WebAssembly.compile(await readFile(path))

  const wasi = new WASI({ version: 'preview1' })

  const instance = await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: wasi.wasiImport,
  })

  wasi.initialize(instance)

  return function parse(source: string): ParseResult {
    return parsePrism(instance.exports, source)
  }
}
