import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { readFile, rm } from 'fs/promises'
import { defineConfig } from 'rollup'
import { fileURLToPath } from 'url'

const isDev = process.env.NODE_ENV !== 'production'

export default defineConfig({
  input: 'src/extension.ts',
  output: {
    file: 'out/extension.js',
    format: 'cjs',
    sourcemap: isDev,
  },
  external: ['vscode'],
  plugins: [
    typescript(),
    nodeResolve({ mainFields: ['main', 'module'] }),
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
        await rm('out', { recursive: true, force: true })
      },
      async buildEnd() {
        const src = fileURLToPath(
          import.meta.resolve(
            '@johnnymorganz/stylua/stylua.node/stylua_lib_bg.wasm',
          ),
        )
        this.emitFile({
          type: 'asset',
          fileName: 'stylua_lib_bg.wasm',
          source: await readFile(src),
          originalFileName: src,
        })
      },
    },
  ],
})
