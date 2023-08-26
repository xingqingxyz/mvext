import vscode from 'vscode'
import { execOpen } from './utils/commandManager'

export function registerQuicklySwitchFile(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'mvext.quicklySwitchFile',
      quicklySwitchFile,
    ),
    vscode.commands.registerCommand(
      'mvext.quicklySwitchTestFile',
      quicklySwitchTestFile,
    ),
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
      } else if (/tsx?/.test(ext)) {
        path = path.replace('/src/', '/dist/') + '.js'
      }
      await execOpen(uri.with({ path }))
    }
  }
}

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
  const nextPath = path.replace(
    /\/__tests?__\/(.+)\.(?:test|spec)\.(\w+)$/,
    '/$1.$2',
  )

  if (nextPath !== path) {
    await execOpen(documentUri.with({ path: nextPath }))
    return
  }

  await vscode.workspace
    .findFiles(
      vscode.workspace
        .asRelativePath(documentUri, false)
        .replace(/\/([^/]+)\.(\w+)$/, '/__test?__/$1.{test,spec}.$2'),
    )
    .then((files) => files.length && execOpen(files[0]))
}
