import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { defineConfig } from 'rollup'
import { fileURLToPath } from 'url'

function copyWasm(isWeb) {
  return {
    name: copyWasm.name,
    async buildStart() {
      await fs.rm(path.join(import.meta.dirname, 'dist'), {
        recursive: true,
        force: true,
      })
      await fs.mkdir('dist')
      const excludeLanguages = ['c-sharp', 'regex', 'ruby']
      const baseNameMap = {
        stylua_lib_bg: 'stylua',
        main: 'shfmt',
      }
      const getBaseName = (base) => baseNameMap[base] ?? base
      await Promise.all(
        (
          await Array.fromAsync(
            fs.glob('node_modules/@vscode/tree-sitter-wasm/wasm/*.wasm', {
              exclude: [
                `**/*{${excludeLanguages.join(',')}}.wasm`,
                '**/tree-sitter.wasm',
              ],
            }),
          )
        )
          .concat(
            'node_modules/web-tree-sitter/tree-sitter.wasm',
            'node_modules/tree-sitter-bash/tree-sitter-bash.wasm',
          )
          .concat(
            isWeb
              ? [
                  'node_modules/@johnnymorganz/stylua/stylua.web/stylua_lib_bg.wasm',
                  'node_modules/sh-syntax/main.wasm',
                ]
              : [],
          )
          .map((file) =>
            fs
              .copyFile(
                file,
                `dist/${getBaseName(path.basename(file, '.wasm'))}.wasm`,
              )
              .catch(console.error),
          ),
      )
    },
  }
}

function buildExtension(isWeb, isProd, plugins = []) {
  return defineConfig({
    input: 'src/extension.ts',
    output: {
      file: `dist/extension.${isWeb ? '' : 'm'}js`,
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
              ].reduce((o, k) => ((o[k] = '@/shims/empty'), o), {}),
            }
          : ['sh-syntax', '@johnnymorganz/stylua/web', '@/shims/web'].reduce(
              (o, k) => ((o[k] = '@/shims/empty'), o),
              {},
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
            /^(?:templateToConcat|concatToTemplate|ifToBinary|ifToTernary|ifToSwitch|ifToSwitchLeft|binaryToIf|ternaryToIf|ternaryToSwitch|ternaryToSwitchLeft|whileToDoWhile|doWhileToWhile|swapTernary|swapIf|arrowToFunctionExpression|arrowToFunction|functionExpressionToArrow|functionToArrow|splitDeclaration|cast|callWrap)$/,
          mangle: { eval: true /* for web-tree-sitter */ },
        }),
      ...plugins,
    ],
  })
}

const isProd = process.env.NODE_ENV === 'production'
const isWeb = process.env.PLATFORM === 'web' || process.env.PLATFORM === 'all'

export default [
  buildExtension(isWeb, isProd, [copyWasm(isWeb)]),
  ...(process.env.PLATFORM === 'all' ? [buildExtension(!isWeb, isProd)] : []),
]
