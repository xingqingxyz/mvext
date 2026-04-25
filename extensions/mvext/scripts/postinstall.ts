#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

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
  exclude: [`**/*{${excluded.join(',')}}.wasm`],
})
  .concat(
    'node_modules/@johnnymorganz/stylua/stylua_lib_bg.wasm',
    'node_modules/sh-syntax/main.wasm',
  )
  .forEach((file) =>
    fs.symlinkSync(
      path.resolve(file),
      `dist/${getBaseName(file)}.wasm`,
      'file',
    ),
  )
