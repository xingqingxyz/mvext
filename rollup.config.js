import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import os from 'os'
import { defineConfig } from 'rollup'

function buildExtension(isWeb, isProd) {
  return defineConfig({
    input: 'src/extension.ts',
    output: {
      file: isWeb ? './dist/web/extension.js' : './dist/extension.js',
      format: isWeb ? 'cjs' : 'es',
      sourcemap: !isProd,
    },
    shimMissingExports: true,
    external: ['vscode'],
    plugins: [
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
      commonjs({ sourceMap: !isProd, esmExternals: (id) => id === 'vscode' }),
      isProd &&
        terser({
          maxWorkers: os.availableParallelism(),
          ecma: 2020,
          module: true,
          sourceMap: false,
        }),
    ],
  })
}

const isProd = process.env.NODE_ENV === 'production'
const isWeb = process.env.PLATFORM === 'web' || process.env.PLATFORM === 'all'

export default [
  buildExtension(isWeb, isProd),
  ...(process.env.PLATFORM === 'all' ? [buildExtension(!isWeb, isProd)] : []),
]
