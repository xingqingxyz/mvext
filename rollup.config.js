import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'

const isDev = process.env.NODE_ENV !== 'production'

export default defineConfig({
  input: 'src/extension.ts',
  output: {
    file: 'out/extension.js',
    format: 'cjs',
    sourcemap: isDev,
  },
  external: ['vscode', '@johnnymorganz/stylua'],
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
  ],
})
