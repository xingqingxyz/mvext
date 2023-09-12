import { EOL, homedir } from 'os'
import * as path from 'path'
import * as vscode from 'vscode'
import batCompItems from '../resources/batCompItems.json'
import { getPrevCharAtPosition } from './utils/completionHelper'
import { execFilePm, tokenToSignal } from './utils/nodeUtils'

export function registerBatCompletion(ctx: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = {
    language: 'bat',
    scheme: 'file',
  }
  ctx.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(selector, {
      provideCompletionItems,
    }),
  )
}

export const provideCompletionItems: vscode.CompletionItemProvider['provideCompletionItems'] =
  async (
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    // context: vscode.CompletionContext,
  ) => {
    if (
      position.character === 0 ||
      /['"`]/.test(getPrevCharAtPosition(document, position))
    ) {
      const wspFd = vscode.workspace.getWorkspaceFolder(document.uri)
      const range = document.getWordRangeAtPosition(position)
      const prefix = range ? document.getText(range) : ''

      try {
        const files = (
          await execFilePm(
            'C:\\Windows\\System32\\where.exe',
            [
              `$PATH:${prefix}*.exe`,
              `$PATH:${prefix}*.bat`,
              `$PATH:${prefix}*.cmd`,
            ],
            {
              env: {
                Path:
                  (wspFd ? path.dirname(wspFd.uri.fsPath) : homedir()) +
                  ';' +
                  process.env.Path!.replace(/C:\\Windows\\System32;/i, ''),
              },
              signal: tokenToSignal(token),
            },
          )
        ).stdout.split(EOL)
        // remove last empty line
        files.pop()

        const { Function } = vscode.CompletionItemKind
        const items = files.map((f) => ({
          label: path.basename(f),
          detail: f,
          kind: Function,
        }))

        return new vscode.CompletionList(batCompItems.concat(items))
      } catch (err) {
        console.error(err)
      }
    }
  }
