import Mocha from 'mocha'
import path from 'path'
import { glob } from 'glob'

export async function run() {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'bdd',
    color: true,
  })
  const testsRoot = path.resolve(__dirname, '..')
  const files = await glob('**/*.test.js', { cwd: testsRoot })
  console.log('files:', files)

  // Add files to the test suite
  files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))
  try {
    // Run the mocha test
    mocha.run((failures) => {
      if (failures > 0) {
        throw Error(`${failures} tests failed.`)
      }
    })
  } catch (err) {
    console.error(err)
    throw err
  }
}

void run()
