import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
  input: 'src/extension.ts',
  output: {
    file: 'out/extension.js',
    format: 'cjs',
    sourcemap: isDev,
  },
  external: 'vscode',
  plugins: [typescript(), nodeResolve(), commonjs(), !isDev && terser()],
})
