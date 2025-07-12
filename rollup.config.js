import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs/promises'
import path from 'path'
import { defineConfig } from 'rollup'

const isDev = process.env.NODE_ENV !== 'production'

export default defineConfig({
  input: 'src/extension.ts',
  output: {
    file: 'out/extension.js',
    format: 'esm',
    sourcemap: isDev,
  },
  external: ['vscode'],
  plugins: [
    typescript(),
    nodeResolve(),
    commonjs(),
    replace({
      preventAssignment: true,
      values: {
        __DEV__: isDev,
      },
    }),
    !isDev && terser(),
    {
      async buildStart() {
        await fs.rm(path.join(import.meta.dirname, 'out'), {
          recursive: true,
          force: true,
        })
      },
      async buildEnd() {
        await fs.cp(
          path.join(
            import.meta.dirname,
            'node_modules/web-tree-sitter/tree-sitter.wasm',
          ),
          'out/tree-sitter.wasm',
        )
      },
    },
  ],
})
