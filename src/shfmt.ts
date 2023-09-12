import { execFileSync } from 'child_process'
import * as vscode from 'vscode'
import { getExtConfig } from './utils/getExtConfig'

export function registerShfmt(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      {
        language: 'shellscript',
        scheme: 'file',
      },
      {
        provideDocumentFormattingEdits: shellscriptFormatter,
      },
    ),
  )
}

export const shellscriptFormatter: vscode.DocumentFormattingEditProvider['provideDocumentFormattingEdits'] =
  (
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    // token: vscode.CancellationToken,
  ) => {
    const text = execFileSync(
      'shfmt',
      getExtConfig().shfmtParserOptions.concat(
        options.insertSpaces ? ['-i', String(options.tabSize)] : [],
      ),
      {
        input: document.getText(),
      },
    ).toString()
    return [
      new vscode.TextEdit(new vscode.Range(0, 0, document.lineCount, 0), text),
    ]
  }
