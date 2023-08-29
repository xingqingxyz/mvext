import vscode from 'vscode'
import provideCodeActions from './provider'

export function registerTsCodeActions(ctx: vscode.ExtensionContext) {
  const tsSelector: vscode.DocumentSelector = [
    {
      language: 'typescript',
      scheme: 'file',
    },
    {
      language: 'javascript',
      scheme: 'file',
    },
    {
      language: 'typescriptreact',
      scheme: 'file',
    },
    {
      language: 'javascriptreact',
      scheme: 'file',
    },
  ]

  ctx.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      tsSelector,
      { provideCodeActions },
      {
        providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite],
      },
    ),
  )
}
