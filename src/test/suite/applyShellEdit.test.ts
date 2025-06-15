import { execByLangId } from '@/evalSelection'
import strict from 'assert/strict'
import { EOL, homedir, tmpdir } from 'os'
import path from 'path'
import { Uri, window } from 'vscode'

before(async function () {
  this.document = (
    await window.showTextDocument(Uri.file(path.join(tmpdir(), 'test.js')))
  ).document
})

describe(`#${execByLangId.name}()`, function () {
  const pwshCode = '(gi ~).FullName;$?'

  describe('should should not rejects', function () {
    it('#pwsh', async function () {
      await strict.doesNotReject(() => execByLangId(pwshCode, this.document))
    })
  })

  describe('should returns expected result', function () {
    it('#pwsh', async function () {
      strict.equal(
        await execByLangId(pwshCode, this.document),
        homedir() + EOL + 'True' + EOL,
      )
    })
  })
})
