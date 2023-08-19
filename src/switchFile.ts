import fs from 'fs/promises'
import vscode from 'vscode'

export function registerSwitchFile(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('mvext.switchFile', switchFile),
  )
}

export async function switchFile() {
  const document = vscode.window.activeTextEditor?.document

  if (!document) {
    return
  }

  if (document.uri.scheme === 'file') {
    let fsPath: string

    try {
      switch (document.languageId) {
        case 'typescript': {
          // js file
          fsPath = document.fileName.replace(/ts$/, 'js')

          await fs
            .access(fsPath)
            .catch(() => {
              // out/ dir
              fsPath = fsPath.replace(/\bsrc\b/, 'out')
              return fs.access(fsPath)
            })
            .catch(() => {
              // dist/ dir
              fsPath = fsPath.replace(/\bout\b/, 'dist')
              return fs.access(fsPath)
            })
          break
        }
        case 'javascript':
        case 'css':
          fsPath = document.fileName.replace(/\.\w+$/, '.html')

          await fs.access(fsPath).catch(() => {
            // ext .htm
            fsPath = fsPath.slice(0, -1)
            return fs.access(fsPath)
          })
          break
        case 'html':
          fsPath = document.fileName.replace(/\.\w+$/, '.css')

          await fs.access(fsPath).catch(() => {
            fsPath = fsPath.replace(/css$/, 'js')
            return fs.access(fsPath)
          })
          break
        default:
          return
      }
      await vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.file(fsPath),
      )
    } catch {
      return
    }
  } else {
    let uri: vscode.Uri

    switch (document.languageId) {
      case 'typescript':
        uri = document.uri.with({
          path: '/__tests__' + document.uri.path.replace(/ts$/, 'test.ts'),
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
    await vscode.commands.executeCommand('vscode.open', uri)
  }
}
