import Mocha from 'mocha'
import path from 'path'
import { glob } from 'glob'

export async function run(
  testsRoot: string,
  cb: (err: any, failures?: number) => void,
) {
  const mocha = new Mocha({
    ui: 'bdd',
    color: true,
  })
  const files = await glob('**/*.test.js', { cwd: testsRoot })
  files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))
  console.log('files:', files)
  try {
    mocha.run((failures) => {
      cb(null, failures)
    })
  } catch (err) {
    cb(err)
  }
}
