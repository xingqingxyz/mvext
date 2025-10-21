import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import os from 'os'
import path from 'path'
import { defineConfig } from 'rollup'
import { fileURLToPath } from 'url'

const isProd = process.env.NODE_ENV === 'production'
const isWeb = process.env.PLATFORM === 'web'

export default defineConfig({
  input: 'src/extension.ts',
  output: {
    file: 'dist/extension.' + (isWeb ? 'cjs' : 'js'),
    format: isWeb ? 'cjs' : 'es',
    sourcemap: !isProd,
  },
  shimMissingExports: true,
  external: ['vscode'],
  plugins: [
    alias({
      entries: isWeb
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
    }),
    replace({
      preventAssignment: true,
      values: {
        __DEV__: '' + !isProd,
        __WEB__: '' + isWeb,
      },
    }),
    typescript({ sourceMap: !isProd }),
    nodeResolve({
      browser: isWeb,
      preferBuiltins: !isWeb,
    }),
    commonjs({ sourceMap: !isProd }),
    isProd &&
      terser({
        maxWorkers: os.availableParallelism(),
        ecma: 2020,
        module: true,
        sourceMap: false,
        keep_fnames:
          // generated using ./scripts/tsGetFunctionKeepNames.ts
          /^(?:templateToConcat|concatToTemplate|ifToBinary|ifToTernary|ifToSwitch|ifToSwitchLeft|binaryToIf|ternaryToIf|ternaryToSwitch|ternaryToSwitchLeft|whileToDoWhile|doWhileToWhile|swapTernary|swapIf|arrowToFunctionExpression|arrowToFunction|functionExpressionToArrow|functionToArrow|splitDeclaration|cast|callWrap)$/,
        mangle: { eval: true /* for web-tree-sitter */ },
      }),
  ],
})
