import { cjsEval, execByLangId, mjsEval } from '../../applyShellEdit'
import * as strict from 'assert/strict'
import { EOL, homedir } from 'os'
import * as path from 'path'
import { Uri, window } from 'vscode'

// eslint-disable-next-line @typescript-eslint/no-misused-promises
describe(`#${execByLangId.name}()`, async function () {
  const pwshCode = '"$(gi ~)"\n$?'
  const { document } = await window.showTextDocument(
    Uri.file(path.join(homedir(), 'test.js')),
  )

  describe('should should not rejects', function () {
    it('#pwsh', async function () {
      await strict.doesNotReject(() =>
        execByLangId(pwshCode, 'powershell', document),
      )
    })
  })

  describe('should returns expected result', function () {
    it('#pwsh', async function () {
      strict.equal(
        await execByLangId(pwshCode, 'powershell', document),
        homedir() + EOL + 'True' + EOL,
      )
    })
  })
})

const homedirJson = JSON.stringify(homedir())

describe('when handle esm exports', function () {
  describe(`#${mjsEval.name}()`, function () {
    const mjsCode = `
import { homedir } from 'os'
function main() {
  if (homedir() !== ${homedirJson}) {
    throw Error('Unexpected homedir')
  }
  return {
    hello: 'world',
    num: 42
  }
}`

    it('should not rejects', async function () {
      await strict.doesNotReject(mjsEval(mjsCode))
    })

    it('should returns object', async function () {
      strict.deepEqual(await mjsEval(mjsCode), { hello: 'world', num: 42 })
    })
  })
})

describe('when handle `main` entry', function () {
  const jsCode = `
const { homedir } = await import('os')
if (homedir() !== ${homedirJson}) {
  throw Error('Unexpected homedir')
}
const hello = 'main'
function main() {
  return {
    hello,
    num: 1024,
  }
}`

  describe(`#${mjsEval.name}()`, function () {
    it('should not rejects', async function () {
      await strict.doesNotReject(mjsEval(jsCode))
    })

    it('should returns object', async function () {
      strict.deepEqual(await mjsEval(jsCode), {
        hello: 'main',
        num: 1024,
      })
    })
  })

  describe(`#${cjsEval.name}()`, function () {
    it('should not rejects', async function () {
      await strict.doesNotReject(cjsEval(jsCode))
    })

    it('should returns object', async function () {
      strict.deepEqual(await cjsEval(jsCode), { hello: 'main', num: 1024 })
    })
  })
})

describe('when commonjs require', function () {
  describe(`#${cjsEval.name}()`, function () {
    const cjsCode = `
const { homedir } = require('os')
if (homedir() !== ${homedirJson}) {
  throw Error('Unexpected homedir')
}
;({ hello: 'world', num: 42 })`

    it('should not rejects', async function () {
      await strict.doesNotReject(cjsEval(cjsCode))
    })

    it('should returns object', async function () {
      strict.deepEqual(await cjsEval(cjsCode), { hello: 'world', num: 42 })
    })
  })
})
