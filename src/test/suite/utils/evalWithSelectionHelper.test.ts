import { describe, it } from 'mocha'
import {
  getExeFromEnv,
  getExeInDir,
} from '../../../utils/evalWithSelectionHelper'
import strict from 'assert/strict'
import path from 'path'

const cwd = process.cwd()

describe(`#${getExeInDir.name}()`, function () {
  it('should rejects', async function () {
    await strict.rejects(() => getExeInDir(cwd, 'git.exe'))
  })

  it('should find package.json', async function () {
    strict.equal(
      await getExeInDir(cwd, 'package.json'),
      path.join(cwd, 'package.json')
    )
  })
})

describe(`#${getExeFromEnv.name}()`, function () {
  it('should rejects', async function () {
    await strict.rejects(() => getExeFromEnv('foo.exe'))
  })

  it('should find git.exe', async function () {
    strict.equal(
      await getExeFromEnv('git'),
      String.raw`C:\Program Files\Git\cmd\git.exe`
    )
  })
})
