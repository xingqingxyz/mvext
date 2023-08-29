import { runTests } from '@vscode/test-electron'
import path from 'path'

void (async function () {
  console.log('Running VSC Tests')
  await runTests({
    extensionDevelopmentPath: process.cwd(),
    extensionTestsPath: path.join(__dirname, './suite'),
  })
})()
