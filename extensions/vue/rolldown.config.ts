import { defineConfig } from 'rolldown'
import { fileURLToPath } from 'url'
import esbuildMinify from '../../internal/esbuildMinifyPlugin'

const isPrebuild = !!process.env.PREBUILD
const isProd = isPrebuild || process.env.NODE_ENV === 'production'
const isWeb = process.env.PLATFORM === 'web'

const resolve = (id: string) => fileURLToPath(import.meta.resolve(id))

export default defineConfig({
  input: isPrebuild
    ? {
        vueLanguageServerMain: resolve('./src/shims/vueLanguageServerMain.ts'),
        vueTypeScriptPlugin: resolve('@vue/typescript-plugin'),
      }
    : resolve('./src/extension.ts'),
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
