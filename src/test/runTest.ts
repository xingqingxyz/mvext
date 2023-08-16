import path from 'path'

import { runTests } from '@vscode/test-electron'

async function main() {
  try {
    await runTests({
      extensionDevelopmentPath: process.cwd(),
      extensionTestsPath: path.resolve(__dirname, './suite/index'),
    })
  } catch (err) {
    console.error(err)
    console.error('Failed to run tests')
    process.exit(1)
  }
}

main()
