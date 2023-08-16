import path from 'path'
import { runTests } from '@vscode/test-electron'

async function main() {
  if (process.env.VSCODE_TEST !== 'true') {
    console.log('Running Node.js Tests')
    require('./suite')
    return
  }

  console.log('Running VSC Tests')
  await runTests({
    extensionDevelopmentPath: process.cwd(),
    extensionTestsPath: path.resolve(__dirname, './suite/index'),
  }).catch((err: unknown) => {
    console.error(err)
    console.error('Failed to run VSC Tests')
    process.exit(1)
  })
}

void main()
