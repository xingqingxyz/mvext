import vscode from 'vscode'

export function registerTsCodeActions(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      tsSelector,
      tsCodeActionProvider,
      {
        providedCodeActionKinds: Object.values(allCodeActionKind),
      },
    ),
  )
}

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

const allCodeActionKind = {
  function: vscode.CodeActionKind.RefactorRewrite.append('function'),
}

const reFunctionCall = /[\w$[\]]+\s*\(.*\)/

const tsCodeActionProvider: vscode.CodeActionProvider = {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    // context: vscode.CodeActionContext,
    // token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    if (range.isEmpty || !reFunctionCall.test(document.getText(range))) {
      return
    }

    const wspEdit = new vscode.WorkspaceEdit()
    wspEdit.set(document.uri, [
      new vscode.SnippetTextEdit(
        range,
        new vscode.SnippetString(
          '${TM_SELECTED_TEXT/^\\s*.+?\\((.*)\\)\\s*$/$1/s}',
        ),
      ),
    ])

    const codeAction = new vscode.CodeAction(
      vscode.l10n.t('Delete Function Call'),
      allCodeActionKind.function,
    )
    codeAction.edit = wspEdit

    return [codeAction]
  },

  resolveCodeAction(
    codeAction: vscode.CodeAction,
    // token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeAction> {
    switch (codeAction.kind) {
      case allCodeActionKind.function:
        return codeAction
      default:
        break
    }
  },
}
