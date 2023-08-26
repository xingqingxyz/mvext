import strict from 'assert/strict'
import { EOL, homedir } from 'os'
import { evalByLangId } from '../../evalWithSelection'

describe(`#${evalByLangId.name}()`, function () {
  const cmdCode = '@set city=布达拉宫\n@echo %city%'
  const pwshCode = '"$(gi ~)"\n$?'
  const bashCode = 'abc=esc && echo $abc\necho $abc'

  describe('should should not rejects', function () {
    it('#cmd', async function () {
      await strict.doesNotReject(() => evalByLangId(cmdCode, 'cmd'))
    })

    it('#pwsh', async function () {
      await strict.doesNotReject(() => evalByLangId(pwshCode, 'pwsh'))
    })

    it('#bash', async function () {
      await strict.doesNotReject(() => evalByLangId(bashCode, 'bash'))
    })
  })

  describe('should returns expected result', function () {
    it('#cmd', async function () {
      strict.equal(await evalByLangId(cmdCode, 'cmd'), '%city%' + EOL)
    })

    it('#pwsh', async function () {
      strict.equal(
        await evalByLangId(pwshCode, 'pwsh'),
        homedir() + EOL + 'True' + EOL,
      )
    })

    it('#bash', async function () {
      strict.equal(await evalByLangId(bashCode, 'bash'), 'esc\nesc\n')
    })
  })
})
