import vscode from 'vscode'
import provideCodeActions from './provider'

export function registerTsCodeActions(ctx: vscode.ExtensionContext) {
  const tsSelector: vscode.DocumentSelector = [
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
  ]

  ctx.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      tsSelector,
      { provideCodeActions },
      {
        providedCodeActionKinds: [vscode.CodeActionKind.Refactor],
      },
    ),
  )
}
