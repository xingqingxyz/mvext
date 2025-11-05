import fs from 'fs/promises'
import path from 'path'

async function symlinkWasm() {
  const excludeLanguages = ['cpp', 'c-sharp', 'regex', 'ruby']
  const baseNameMap = {
    stylua_lib_bg: 'stylua',
    main: 'shfmt',
    'tree-sitter-bash': 'tree-sitter-shellscript',
    'tree-sitter-tsx': 'tree-sitter-typescriptreact',
  }
  const getBaseName = (file: string) => (
    (file = path.basename(file, '.wasm')),
    baseNameMap[file as 'main'] ?? file
  )
  await fs.rm('dist', { recursive: true, force: true })
  await fs.mkdir('dist')
  await Promise.all(
    (
      await Array.fromAsync(
        fs.glob('node_modules/@vscode/tree-sitter-wasm/wasm/*.wasm', {
          exclude: [
            `**/*{${excludeLanguages.join(',')}}.wasm`,
            '**/tree-sitter.wasm',
          ],
        }),
      )
    )
      .concat(
        'node_modules/web-tree-sitter/tree-sitter.wasm',
        'node_modules/tree-sitter-bash/tree-sitter-bash.wasm',
        'node_modules/@johnnymorganz/stylua/stylua.web/stylua_lib_bg.wasm',
        'node_modules/sh-syntax/main.wasm',
      )
      .map((file) =>
        fs
          .symlink(path.resolve(file), `dist/${getBaseName(file)}.wasm`, 'file')
          .catch(console.error),
      ),
  )
}

await symlinkWasm()
