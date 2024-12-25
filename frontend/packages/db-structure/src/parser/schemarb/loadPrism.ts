/*
The following modifications are applied to a file from:
https://github.com/ruby/prism/blob/v1.2.0/javascript/src/index.js

To support Node.js versions below 19.8, we substitute:
WebAssembly.instantiate(wasm, wasi.getImportObject())
with:
WebAssembly.instantiate(wasm, { wasi_snapshot_preview1: wasi.wasiImport })

See also https://github.com/ruby/prism/discussions/3310

Consider removing this patch once support for Node.js v18 is no longer necessary
*/

// biome-ignore lint/correctness/noNodejsModules: This import is server-side specific because loadPrism() is exclusively invoked in server environments.
import { readFile } from 'node:fs/promises'
// biome-ignore lint/correctness/noNodejsModules: This import is server-side specific because loadPrism() is exclusively invoked in server environments.
// import { fileURLToPath } from 'node:url'
// biome-ignore lint/correctness/noNodejsModules: This import is server-side specific because loadPrism() is exclusively invoked in server environments.
import { WASI } from 'node:wasi'
import type { ParseResult } from '@ruby/prism/src/deserialize.js'
import { parsePrism } from '@ruby/prism/src/parsePrism.js'

// let prismWasmUrl = fileURLToPath(new URL('prism.wasm', import.meta.url))
let prismWasmUrl = ''

export const setPrismWasmUrl = (url: string): void => {
  prismWasmUrl = url
}

export async function loadPrism(): Promise<(source: string) => ParseResult> {
  // console.log({
  //   url: new URL('prism.wasm', import.meta.url),
  //   // fileURLToPath: fileURLToPath(new URL('prism.wasm', import.meta.url)),
  //   // prismWasmUrl,
  // })
  const wasm = await WebAssembly.compile(await readFile(prismWasmUrl))
  // const wasm = await WebAssembly.compileStreaming(fetch("https://unpkg.com/@ruby/prism@latest/src/prism.wasm"));

  const wasi = new WASI({ version: 'preview1' })

  // Patch applied for compatibility
  const instance = await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: wasi.wasiImport,
  })

  wasi.initialize(instance)

  return function parse(source: string): ParseResult {
    return parsePrism(instance.exports, source)
  }
}
