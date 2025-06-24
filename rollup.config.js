import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { rm } from 'fs/promises'
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
        await rm('out', { recursive: true, force: true })
      },
    },
  ],
})
