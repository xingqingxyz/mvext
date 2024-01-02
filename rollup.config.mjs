import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import path from 'path'
import { defineConfig } from 'rollup'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
  input: 'src/extension.ts',
  output: {
    file: 'out/extension.js',
    format: 'cjs',
    paths: (id) =>
      id.startsWith('@/') ? path.join(__dirname, 'src', id.slice(2)) : id,
    sourcemap: isDev,
  },
  external: 'vscode',
  plugins: [
    typescript(),
    resolve(),
    replace({ __DEV__: isDev, sourceMap: isDev, preventAssignment: true }),
    !isDev && terser(),
  ],
})
