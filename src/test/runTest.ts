import path from 'path'

void (async function main() {
  if (process.env.LOCAL_TEST === 'true') {
    console.log('Running Local Tests')
    await (
      await import('./suite/index.js')
    ).run(path.resolve(__dirname, './suite-local'), (err) => {
      console.error(err)
    })
    return
  }

  console.log('Running VSC Tests')
  await (
    await import('@vscode/test-electron')
  ).runTests({
    extensionDevelopmentPath: process.cwd(),
    extensionTestsPath: path.resolve(__dirname, './suite'),
  })
})()
