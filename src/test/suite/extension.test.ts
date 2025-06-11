import strict from 'assert/strict'
import fs from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { Uri, commands, window } from 'vscode'

describe('vscode', function () {
  it('#transformTo[*]Case()', async function () {
    const { executeCommand } = commands
    const filename = path.join(tmpdir(), 'test.js')
    await fs.writeFile(filename, 'hello-world', 'utf-8')
    const { document } = await window.showTextDocument(Uri.file(filename))

    await executeCommand('editor.action.transformToSnakecase')
    strict.equal(document.getText(), 'hello_world')
    await executeCommand('editor.action.transformToKebabcase')
    strict.equal(document.getText(), 'Hello-World')
    await executeCommand('editor.action.transformToPascalcase')
    strict.equal(document.getText(), 'HelloWorld')
    await executeCommand('editor.action.transformToCamelcase')
    strict.equal(document.getText(), 'helloWorld')
    await executeCommand('editor.action.transformToTitlecase')
    strict.equal(document.getText(), 'Helloworld')
    await executeCommand('editor.action.transformToUppercase')
    strict.equal(document.getText(), 'HELLOWORLD')
    await executeCommand('editor.action.transformToLowercase')
    strict.equal(document.getText(), 'helloworld')
  })
})
