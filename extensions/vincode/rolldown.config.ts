import { defineConfig } from 'rolldown'
import esbuildMinify from '../../internal/esbuildMinifyPlugin'

const isProd = process.env.NODE_ENV === 'production'
const isWeb = process.env.PLATFORM === 'web'

export default defineConfig({
  input: 'src/extension.ts',
  output: {
    file: isWeb ? 'dist/extension.cjs' : 'dist/extension.js',
    format: isWeb ? 'cjs' : 'es',
    sourcemap: !isProd,
  },
  platform: isWeb ? 'browser' : 'node',
  external: ['vscode'],
  transform: {
    target: 'node22',
    define: {
      __DEV__: !isProd + '',
      __WEB__: isWeb + '',
    },
    dropLabels: isProd ? ['DEBUG'] : undefined,
    typescript: isProd
      ? { declaration: {}, optimizeConstEnums: true, optimizeEnums: true }
      : undefined,
  },
  plugins: [isProd && esbuildMinify],
})
