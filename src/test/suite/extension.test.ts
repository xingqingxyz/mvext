// import vscode from 'vscode'
import strict from 'assert/strict'
import { describe, it } from 'mocha'

describe('vscode', function () {
  it('work', function () {
    // try {
    //   const inputVal = await vscode.window.showInputBox({
    //     title: 'test',
    //     prompt: 'I will show your inputs',
    //     value: 'guess?',
    //   })
    //   console.log(inputVal)
    // } catch (err) {
    //   console.log('vsc err')
    //   console.error(err)
    // }
    strict.equal(-1, [1, 2, 3].indexOf(5))
    strict.equal(-1, [1, 2, 3].indexOf(0))
  })
})
