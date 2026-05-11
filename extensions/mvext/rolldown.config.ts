import { defineConfig } from 'rolldown'
import { fileURLToPath } from 'url'
import empty from '../../internal/emptyPlugin'
import esbuildMinify from '../../internal/esbuildMinifyPlugin'

const isProd = process.env.NODE_ENV === 'production'
const isWeb = process.env.PLATFORM === 'web'

export default defineConfig({
  input: 'src/extension.ts',
  output: {
    file: isWeb ? 'dist/extension.cjs' : 'dist/extension.js',
    format: isWeb ? 'cjs' : 'es',
    codeSplitting: !isWeb,
    sourcemap: !isProd,
  },
  shimMissingExports: true,
  platform: isWeb ? 'browser' : 'node',
  external: ['vscode'],
  resolve: {
    alias: isWeb
      ? {
          os: 'os-browserify',
          path: 'path-browserify',
          which: '@/shims/web/which.ts',
          'web-tree-sitter': fileURLToPath(
            import.meta.resolve('web-tree-sitter'),
          ),
        }
      : {},
    mainFields: (isWeb ? ['browser'] : []).concat(['module', 'main']),
  },
  transform: {
    target: 'node22',
    define: {
      __DEV__: !isProd + '',
      __WEB__: isWeb + '',
    },
    dropLabels: isProd ? ['DEBUG'] : undefined,
    typescript: isProd
      ? {
          optimizeConstEnums: true,
          optimizeEnums: true,
        }
      : undefined,
  },
  plugins: [
    empty(
      isWeb
        ? [
            'child_process',
            'crypto',
            'fs/promises',
            'fs',
            'module',
            'url',
            'util',
            'vm',
          ]
        : ['sh-syntax', '@johnnymorganz/stylua/web', '@/shims/web'],
    ),
    isProd && esbuildMinify(),
  ],
})
