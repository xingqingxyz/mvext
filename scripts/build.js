const esbuild = require('esbuild')
const { glob } = require('glob')

const common = {
  platform: 'node',
  format: 'cjs',
  write: true,
}

void (async function main() {
  switch (process.argv[2]) {
    case 'build': {
      require('fs').rmSync('out', { recursive: true, force: true })
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
    }
    case 'build-test': {
      require('fs').rmSync('out/test', { recursive: true, force: true })
      const srcFiles = await glob('src/**/**.ts')
      await esbuild.build({
        ...common,
        entryPoints: srcFiles,
        sourcemap: true,
        outbase: 'src',
        outdir: 'out',
      })
      console.log('Building finished.')
      return
    }
    default: {
      const srcFiles = await glob('src/**/**.ts')
      const srcCtx = await esbuild.context({
        ...common,
        entryPoints: srcFiles,
        sourcemap: true,
        outbase: 'src',
        outdir: 'out',
      })

      await srcCtx.watch()
      console.log('start watching')
    }
  }
})()
