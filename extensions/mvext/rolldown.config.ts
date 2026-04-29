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
          ...[
            'child_process',
            'crypto',
            'fs/promises',
            'fs',
            'module',
            'url',
            'util',
            'vm',
          ].reduce(
            (o, k) => (
              (o[k] = fileURLToPath(
                import.meta.resolve('../../internal/empty'),
              )),
              o
            ),
            {} as Record<string, string>,
          ),
        }
      : [
          'sh-syntax',
          '@johnnymorganz/stylua/web',
          fileURLToPath(import.meta.resolve('./src/shims/web')),
        ].reduce(
          (o, k) => (
            (o[k] = fileURLToPath(import.meta.resolve('../../internal/empty'))),
            o
          ),
          {} as Record<string, string>,
        ),
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
          declaration: { sourcemap: true, stripInternal: true },
          optimizeConstEnums: true,
          optimizeEnums: true,
        }
      : undefined,
  },
  plugins: [isProd && esbuildMinify()],
})
