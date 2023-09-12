import strict from 'assert/strict'
import fs from 'fs/promises'
import { homedir } from 'os'
import path from 'path'
import vscode from 'vscode'
const { executeCommand } = vscode.commands

describe('vscode', function () {
  it('#transformTo[*]Case()', async function () {
    this.timeout('5s')
    const filename = path.join(homedir(), 'test.js')
    await fs.writeFile(filename, 'hello-world', 'utf-8')
    const { document } = await vscode.window.showTextDocument(
      vscode.Uri.file(filename),
    )
    await executeCommand('editor.action.selectAll')

    await executeCommand('mvext.transformToLowerCase')
    strict.equal(document.getText(), 'hello-world')
    await executeCommand('mvext.transformToTitleCase')
    strict.equal(document.getText(), 'Hello World')
    await executeCommand('mvext.transformToHeaderCase')
    strict.equal(document.getText(), 'Hello-World')
    await executeCommand('mvext.transformToSnakeCase')
    strict.equal(document.getText(), 'hello_world')
  })
})
