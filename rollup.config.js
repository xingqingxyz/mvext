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

async function symlinkWasm() {
  await fs.rm('dist', { recursive: true, force: true })
  await fs.mkdir('dist/web', { recursive: true })
  const excludeLanguages = ['cpp', 'c-sharp', 'regex', 'ruby']
  const baseNameMap = {
    stylua_lib_bg: 'stylua',
    main: 'shfmt',
    'tree-sitter-bash': 'tree-sitter-shellscript',
    'tree-sitter-tsx': 'tree-sitter-typescriptreact',
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
        'node_modules/@johnnymorganz/stylua/stylua.web/stylua_lib_bg.wasm',
        'node_modules/sh-syntax/main.wasm',
      )
      .map((file) =>
        fs
          .symlink(
            path.resolve(file),
            `dist/${getBaseName(path.basename(file, '.wasm'))}.wasm`,
            'file',
          )
          .catch(console.error),
      ),
  )
}

function buildExtension(isWeb, isProd) {
  return defineConfig({
    input: 'src/extension.ts',
    output: {
      file: isWeb ? 'dist/web/extension.cjs' : 'dist/extension.js',
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
    ],
  })
}

const isProd = process.env.NODE_ENV === 'production'
const isWeb = process.env.PLATFORM === 'web' || process.env.PLATFORM === 'all'
await symlinkWasm()

export default [
  buildExtension(isWeb, isProd),
  ...(process.env.PLATFORM === 'all' ? [buildExtension(!isWeb, isProd)] : []),
]
