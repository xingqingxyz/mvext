import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import wasm from '@rollup/plugin-wasm'
import { defineConfig } from 'rollup'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  input: 'src/extension.ts',
  output: {
    file: 'out/extension.js',
    format: 'cjs',
    sourcemap: isProd,
  },
  external: ['vscode', '@johnnymorganz/stylua'],
  plugins: [
    wasm(),
    typescript(),
    nodeResolve(),
    commonjs(),
    replace({
      preventAssignment: true,
      values: {
        __DEV__: !isProd,
      },
    }),
    isProd && terser(),
  ],
})
