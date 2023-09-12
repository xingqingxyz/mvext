import { EOL, homedir } from 'os'
import * as path from 'path'
import * as vscode from 'vscode'
import batCompItems from '../resources/batCompItems.json'
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

const reBatComp = /^\s*$|(["`])((?!\1).){0,4}$/
const whereEnvPath = process.env.Path!.replace(/C:\\Windows\\System32;/i, '')
export const provideCompletionItems: vscode.CompletionItemProvider['provideCompletionItems'] =
  async (
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    // context: vscode.CompletionContext,
  ) => {
    const matches = reBatComp.exec(
      document.getText(
        new vscode.Range(position.with({ character: 0 }), position),
      ),
    )

    if (matches) {
      try {
        const prefix = matches[2] || ''
        const wspFd = vscode.workspace.getWorkspaceFolder(document.uri)
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
                  whereEnvPath,
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
