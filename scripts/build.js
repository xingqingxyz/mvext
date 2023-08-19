/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild')
const { glob } = require('glob')
const path = require('path')

void (async function main() {
  if (process.env.NODE_ENV === 'stage') {
    await esbuild.build({
      entryPoints: [path.join(__dirname, '../src/extension.ts')],
      external: ['vscode'],
      bundle: true,
      platform: 'node',
      minify: true,
      write: true,
      outfile: path.join(__dirname, '../out/extension.js'),
    })
    console.log('Building finished.')
    return
  }

  const srcDir = path.resolve(__dirname, '../src')
  const entryPoints = (
    await glob('**/**.ts', {
      cwd: srcDir,
    })
  ).map((f) => path.join(srcDir, f))

  const ctx = await esbuild.context({
    entryPoints,
    sourcemap: true,
    write: true,
    format: 'cjs',
    platform: 'node',
    outbase: srcDir,
    outdir: path.resolve(__dirname, '../out'),
  })
  console.log('[watch] build started')
  await ctx.watch()
  console.log('[watch] build finished, watching for changes...')
})()
