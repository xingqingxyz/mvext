import vscode from 'vscode'
import strict from 'assert/strict'
import { describe, it } from 'mocha'

describe('vscode', function () {
  it('work', async function () {
    await vscode.window
      .showInformationMessage('Hello World')
      .then(undefined, (err) => {
        strict.ok(err instanceof Error)
      })
    strict.equal(-1, [1, 2, 3].indexOf(5))
    strict.equal(-1, [1, 2, 3].indexOf(0))
  })
})
