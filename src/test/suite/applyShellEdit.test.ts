import strict from 'assert/strict'
import { EOL, homedir } from 'os'
import path from 'path'
import { Uri, window } from 'vscode'
import { cjsEval, execByLangId } from '@/applyShellEdit'

const { document } = await window.showTextDocument(
  Uri.file(path.join(homedir(), 'test.js')),
)

describe(`#${execByLangId.name}()`, async function () {
  const pwshCode = '"$(gi ~)"\n$?'

  describe('should should not rejects', function () {
    it('#pwsh', async function () {
      await strict.doesNotReject(() => execByLangId(pwshCode, document))
    })
  })

  describe('should returns expected result', function () {
    it('#pwsh', async function () {
      strict.equal(
        await execByLangId(pwshCode, document),
        homedir() + EOL + 'True' + EOL,
      )
    })
  })
})

const homedirJson = JSON.stringify(homedir())

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

  describe(`#${cjsEval.name}()`, function () {
    it('should not rejects', async function () {
      await strict.doesNotReject(cjsEval(jsCode, document))
    })

    it('should returns object', async function () {
      strict.deepEqual(await cjsEval(jsCode, document), {
        hello: 'main',
        num: 1024,
      })
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
      await strict.doesNotReject(cjsEval(cjsCode, document))
    })

    it('should returns object', async function () {
      strict.deepEqual(await cjsEval(cjsCode, document), {
        hello: 'world',
        num: 42,
      })
    })
  })
})
