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

const isProd = process.env.NODE_ENV === 'production'
const isWeb = isProd || process.env.NODE_ENV === 'web'

const baseConfig = defineConfig({
  input: 'src/extension.ts',
  output: {
    file: `dist/extension${isWeb ? '.web.' : '.m'}js`,
    format: isWeb ? 'cjs' : 'es',
    sourcemap: !isProd,
  },
  shimMissingExports: true,
  external: ['vscode'],
  plugins: [
    isWeb &&
      alias({
        entries: {
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
          ].reduce((o, k) => ((o[k] = '@/shims/web'), o), {}),
        },
      }),
    typescript(),
    nodeResolve({
      browser: isWeb,
      preferBuiltins: !isWeb,
    }),
    commonjs(),
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      },
    }),
    isProd &&
      terser({
        maxWorkers: os.availableParallelism(),
        ecma: isWeb ? undefined : 2023,
        mangle: {
          eval: true /* for web-tree-sitter */,
          keep_fnames:
            /^(?:templateToConcat|concatToTemplate|ifToBinary|ifToTernary|ifToSwitch|ifToSwitchLeft|binaryToIf|ternaryToIf|ternaryToSwitch|ternaryToSwitchLeft|whileToDoWhile|doWhileToWhile|swapTernary|swapIf|arrowToFunctionExpression|arrowToFunction|functionExpressionToArrow|functionToArrow|splitDeclaration|cast|callWrap)$/,
        },
      }),
    {
      async buildStart() {
        await fs.rm(path.join(import.meta.dirname, 'dist'), {
          recursive: true,
          force: true,
        })
        await fs.mkdir('dist')
        const excludeLanguages = ['c-sharp', 'regex', 'ruby']
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
            .concat('node_modules/web-tree-sitter/tree-sitter.wasm')
            .map((file) =>
              fs
                .symlink(
                  path.relative('dist', file),
                  `dist/${path.basename(file)}`,
                  'file',
                )
                .catch(console.error),
            ),
        )
      },
    },
  ],
})

export default isProd
  ? defineConfig([
      baseConfig,
      {
        ...baseConfig,
        output: {
          ...baseConfig.output,
          file: 'dist/extension.mjs',
          format: 'es',
        },
        plugins: baseConfig.plugins.slice(1, -1),
      },
    ])
  : baseConfig
