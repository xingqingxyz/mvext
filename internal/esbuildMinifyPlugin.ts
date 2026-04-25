import { formatMessages, transform, type TransformOptions } from 'esbuild'
import type { Plugin } from 'rolldown'

export default function esbuildMinify(opts: TransformOptions = {}): Plugin {
  return {
    name: 'esbuild-minify',
    outputOptions(options) {
      options.minify = false
      return options
    },
    async renderChunk(contents, _, { format, sourcemap }) {
      const { code, map, warnings } = await transform(contents, {
        ...opts,
        format: format === 'cjs' ? 'cjs' : 'esm',
        platform: format === 'cjs' ? 'browser' : 'node',
        target: 'node22',
        loader: 'js',
        minify: true,
        sourcemap: sourcemap === 'hidden' ? false : sourcemap,
        logLevel: 'warning',
        logLimit: 10,
      })
      if (!warnings.length) {
        return { code, map }
      }
      const messages = await formatMessages(warnings, {
        kind: 'warning',
        color: true,
      })
      for (let i = 0; i < warnings.length; i++) {
        const { location } = warnings[i]
        const message = messages[i]
        this.warn({
          message,
          loc: location
            ? {
                line: location.line,
                column: location.column,
              }
            : undefined,
        })
      }
      return { code, map }
    },
  }
}
