import vscode from 'vscode'
import { describe, it } from 'mocha'
import strict from 'assert/strict'
import path from 'path'
import { homedir } from 'os'

describe('#evalWithSelection', function () {
  it('should get truly result', async function () {
    const jsCode = `const { readdirSync } = require('fs')
const files = readdirSync(process.cwd())
if (
  !(files.find((v) => v === 'package.json') &&
  files.find((v) => v === 'tsconfig.json'))
) {throw Error('Not found')}
;({ hello: 'world', num: 42 })
`
    const range = await editorInsertText(jsCode)
    // TODO:fix
    await vscode.commands.executeCommand('select', range)
    await vscode.commands.executeCommand('mvext.evalWithSelection')
    const { document, selection } = vscode.window.activeTextEditor!
    const result = document.getText(selection)
    strict.equal(result, "{ hello: 'world', num: 42 }")
  })
})

async function editorInsertText(text: string) {
  const editor =
    vscode.window.activeTextEditor ??
    // TODO:fix
    (await vscode.commands.executeCommand<vscode.TextEditor>(
      'vscode.open',
      path.resolve(homedir(), './test.js'),
    ))

  await editor.edit((b) => {
    b.insert(editor.document.positionAt(0), text)
  })
  return new vscode.Range(
    editor.document.positionAt(0),
    editor.document.positionAt(text.length),
  )
}
