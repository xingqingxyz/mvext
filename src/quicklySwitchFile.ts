import * as vscode from 'vscode'

export function registerQuicklySwitchFile(ctx: vscode.ExtensionContext) {
  const { registerCommand } = vscode.commands
  ctx.subscriptions.push(
    registerCommand('mvext.quicklySwitchFile', quicklySwitchFile),
    registerCommand('mvext.quicklySwitchTestFile', quicklySwitchTestFile),
  )
}

export async function quicklySwitchFile() {
  const documentUri = vscode.window.activeTextEditor?.document.uri
  if (documentUri) {
    const matches = /(.+)\.(\w+$)/.exec(documentUri.fsPath)
    if (matches) {
      let nextPath = matches[1]
      const ext = matches[2]

      if (/html?/.test(ext)) {
        nextPath += '.css'
      } else if (/css|js/.test(ext)) {
        nextPath += '.html'
      } else if (/[cm]?ts/.test(ext)) {
        nextPath = documentUri.path.slice(0, -2) + 'js'
      }

      try {
        await vscode.window.showTextDocument(
          documentUri.with({ path: nextPath }),
        )
      } catch {
        /* ignore ENOENT */
      }
    }
  }
}

const reStripTest = /\/__tests?__\/(.+)\.(?:test|spec)\.(\w+)$/
const reAddTest = /\/([^/]+)\.(\w+)$/
/**
 * Examples:
 * `file:///opt/proj/src/hello.tsx -> file:///opt/proj/src/__tests__/hello.{test,spec}.tsx`
 * @returns
 */
export async function quicklySwitchTestFile() {
  const documentUri = vscode.window.activeTextEditor?.document.uri

  if (documentUri) {
    const { fsPath } = documentUri
    const nextPath = fsPath.replace(reStripTest, '/$1.$2')

    let uri = documentUri.with({ path: nextPath })
    if (nextPath === fsPath) {
      const files = await vscode.workspace.findFiles(
        vscode.workspace
          .asRelativePath(documentUri, false)
          .replace(reAddTest, '/__test?__/$1.{test,spec}.$2'),
      )
      if (files.length) {
        uri = files[0]
      }
    }

    try {
      await vscode.window.showTextDocument(uri)
    } catch {
      /* ignore ENOENT */
    }
  }
}
