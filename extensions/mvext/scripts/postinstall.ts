#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const excluded: string[] = []
const baseNameMap = {
  stylua_lib_bg: 'stylua',
  main: 'shfmt',
  'tree-sitter-bash': 'tree-sitter-shellscript',
  'tree-sitter-c-sharp': 'tree-sitter-csharp',
  'tree-sitter-tsx': 'tree-sitter-typescriptreact',
}
const getBaseName = (file: string) => (
  (file = path.basename(file, '.wasm')), baseNameMap[file as 'main'] ?? file
)
fs.rmSync('dist', { recursive: true, force: true })
fs.mkdirSync('dist')
fs.globSync('node_modules/@vscode/tree-sitter-wasm/wasm/*.wasm', {
  exclude: ['**/tree-sitter.wasm', `**/*{${excluded.join(',')}}.wasm`],
})
  .concat(
    [
      'web-tree-sitter/web-tree-sitter.wasm',
      '@johnnymorganz/stylua/stylua_lib_bg.wasm',
      'sh-syntax/main.wasm',
    ].map((id) => fileURLToPath(import.meta.resolve(id))),
  )
  .forEach((file) =>
    fs.symlinkSync(
      path.resolve(file),
      `dist/${getBaseName(file)}.wasm`,
      'file',
    ),
  )
