import fs from 'fs'
import vscode from 'vscode'
const { registerCommand, executeCommand } = vscode.commands

export function registerSwitchFile(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(registerCommand('mvext.switchFile', switchFile))
}

export async function switchFile() {
  const document = vscode.window.activeTextEditor?.document

  if (!document) {
    return
  }

  let uri: vscode.Uri

  if (document.uri.scheme === 'file') {
    let fsPath: string

    switch (document.languageId) {
      case 'typescript':
        fsPath = document.fileName.replace(/ts$/, 'js')
        console.log(fsPath)
        if (!fs.existsSync(fsPath)) {
          fsPath = fsPath.replace(/\bsrc\b/, 'out')
          console.log(fsPath)
          if (!fs.existsSync(fsPath)) {
            fsPath = fsPath.replace(/\bout\b/, 'dist')
            console.log(fsPath)
            if (!fs.existsSync(fsPath)) {
              return
            }
          }
        }
        break
      case 'javascript':
      case 'css':
        fsPath = document.fileName.replace(/\.\w+$/, '.html')
        if (!fs.existsSync(fsPath)) {
          fsPath = fsPath.slice(0, -1)
          if (!fs.existsSync(fsPath)) {
            return
          }
        }
        break
      case 'html':
        fsPath = document.fileName.replace(/\.\w+$/, '.css')
        if (!fs.existsSync(fsPath)) {
          return
        }
        break
      default:
        return
    }
    uri = vscode.Uri.file(fsPath)
  } else {
    switch (document.languageId) {
      case 'typescript':
        uri = document.uri.with({
          path: document.uri.path.replace(/ts$/, 'js'),
        })
        break
      case 'javascript':
      case 'css':
        uri = document.uri.with({
          path: document.uri.path.replace(/\.\w+$/, '.html'),
        })
        break
      case 'html':
        uri = document.uri.with({
          path: document.uri.path.replace(/\.\w+$/, '.css'),
        })
        break
      default:
        return
    }
  }
  console.log(uri.fsPath)
  await executeCommand('vscode.open', uri)
}
