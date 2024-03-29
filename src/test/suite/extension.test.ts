import strict from 'assert/strict'
import fs from 'fs/promises'
import { homedir } from 'os'
import path from 'path'
import { Uri, commands, window } from 'vscode'

describe('vscode', function () {
  it('#transformTo[*]Case()', async function () {
    const { executeCommand } = commands

    this.timeout('5s')
    const filename = path.join(homedir(), 'test.js')
    await fs.writeFile(filename, 'hello-world', 'utf-8')
    const { document } = await window.showTextDocument(Uri.file(filename))
    await executeCommand('editor.action.selectAll')

    await executeCommand('mvext.transformTolower')
    strict.equal(document.getText(), 'hello-world')
    await executeCommand('mvext.transformTotitle')
    strict.equal(document.getText(), 'Hello World')
    await executeCommand('mvext.transformToheader')
    strict.equal(document.getText(), 'Hello-World')
    await executeCommand('mvext.transformTosnake')
    strict.equal(document.getText(), 'hello_world')
  })
})
