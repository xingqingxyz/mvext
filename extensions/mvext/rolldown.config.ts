import path from 'path'
import { defineConfig } from 'rolldown'
import { fileURLToPath } from 'url'
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
  resolve: {
    alias: isWeb
      ? {
          os: 'os-browserify',
          path: 'path-browserify',
          which: '@/shims/web/which.ts',
          'web-tree-sitter': path.join(
            fileURLToPath(import.meta.resolve('web-tree-sitter')),
            '../tree-sitter.cjs',
          ),
          ...[
            'child_process',
            'fs/promises',
            'fs',
            'module',
            'url',
            'util',
            'crypto',
          ].reduce(
            (o, k) => ((o[k] = '@/shims/empty'), o),
            {} as Record<string, string>,
          ),
        }
      : ['sh-syntax', '@johnnymorganz/stylua/web', '@/shims/web'].reduce(
          (o, k) => ((o[k] = '@/shims/empty'), o),
          {} as Record<string, string>,
        ),
  },
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
