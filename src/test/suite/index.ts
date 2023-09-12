import { glob } from 'glob'
import Mocha from 'mocha'
import path from 'path'

export function run() {
  const mocha = new Mocha({
    color: true,
    inlineDiffs: true,
  })

  return new Promise<void>((c, e) => {
    const testRoot = path.join(__dirname, '..')
    const testFiles = new glob.Glob('**/*.test.js', { cwd: testRoot })
    const testFileStream = testFiles.stream()

    testFileStream.on('data', (file) => {
      console.log(file)
      mocha.addFile(path.join(testRoot, file))
    })
    testFileStream.on('error', (err) => {
      e(err)
    })
    testFileStream.on('end', () => {
      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`))
          } else {
            c()
          }
        })
      } catch (err) {
        console.error(err)
        e(err)
      }
    })
  })
}
