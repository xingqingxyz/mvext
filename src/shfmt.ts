import vscode from 'vscode'
import { getExtConfig } from './utils/getExtConfig'
import { execFilePm } from './utils/nodeUtils'

export function registerShfmt(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider('shellscript', {
      provideDocumentFormattingEdits: shellscriptFormatter,
    }),
  )
}

export const shellscriptFormatter: vscode.DocumentFormattingEditProvider['provideDocumentFormattingEdits'] =
  (
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    // token: vscode.CancellationToken,
  ): undefined =>
    void execFilePm(
      'shfmt',
      getExtConfig().shfmtParserOptions.concat(
        options.insertSpaces ? ['-i', String(options.tabSize)] : [],
        '-w',
        document.fileName,
      ),
    )

// export const batFormatter: vscode.DocumentFormattingEditProvider['provideDocumentFormattingEdits'] =
//   (
//     document: vscode.TextDocument,
//     options: vscode.FormattingOptions,
//     // token: vscode.CancellationToken,
//   ): undefined =>
//     void execFilePm(
//       'shfmt',
//       getExtConfig().shfmtParserOptions.concat(
//         options.insertSpaces ? ['-i', String(options.tabSize)] : [],
//         '-w',
//         document.fileName,
//       ),
//     )
