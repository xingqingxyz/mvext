import vscode from 'vscode'
import { execOpen } from './utils/commandManager'

export function registerQuicklySwitchFile(ctx: vscode.ExtensionContext) {
  const { registerCommand } = vscode.commands
  ctx.subscriptions.push(
    registerCommand('mvext.quicklySwitchFile', quicklySwitchFile),
    registerCommand('mvext.quicklySwitchTestFile', quicklySwitchTestFile),
  )
}

export async function quicklySwitchFile() {
  const uri = vscode.window.activeTextEditor?.document.uri
  if (uri) {
    const matches = /(.+)\.(\w+$)/.exec(uri.path)
    if (matches) {
      let path = matches[1]
      const ext = matches[2]

      if (/html?/.test(ext)) {
        path += '.css'
      } else if (/css|js/.test(ext)) {
        path += '.html'
      } else if (/[cm]?ts/.test(ext)) {
        path = uri.path.slice(0, -2) + 'js'
      }
      await execOpen(uri.with({ path }))
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

  if (!documentUri) {
    return
  }

  const { path } = documentUri
  const nextPath = path.replace(reStripTest, '/$1.$2')

  if (nextPath !== path) {
    await execOpen(documentUri.with({ path: nextPath }))
    return
  }

  const files = await vscode.workspace.findFiles(
    vscode.workspace
      .asRelativePath(documentUri, false)
      .replace(reAddTest, '/__test?__/$1.{test,spec}.$2'),
  )
  if (files.length) {
    await execOpen(files[0])
  }
}
