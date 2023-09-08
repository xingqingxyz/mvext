const esbuild = require('esbuild')
const { glob } = require('glob')

const common = {
  platform: 'node',
  format: 'cjs',
  write: true,
}

void (async function main() {
  switch (process.argv[2]) {
    case 'build':
      await esbuild.build({
        ...common,
        entryPoints: ['src/extension.ts'],
        external: ['vscode'],
        bundle: true,
        minify: true,
        outfile: 'out/extension.js',
      })
      console.log('Building finished.')
      return

    case 'build-test':
      require('fs').rmSync('out/test', { recursive: true, force: true })
      await esbuild.build({
        ...common,
        entryPoints: await glob('src/**/**.ts'),
        sourcemap: true,
        outbase: 'src',
        outdir: 'out',
      })
      console.log('Building finished.')
      return

    default:
      await (
        await esbuild.context({
          ...common,
          entryPoints: ['src/extension.ts'],
          external: ['vscode'],
          bundle: true,
          sourcemap: true,
          outfile: 'out/extension.js',
        })
      ).watch()
      console.log('start watching')
  }
})()
