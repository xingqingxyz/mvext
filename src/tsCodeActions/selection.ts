import { LangIds } from '@/utils/constants'
import * as vscode from 'vscode'

export class SelectionCodeActionsProvider {
  static readonly rewriteFunction =
    vscode.CodeActionKind.RefactorRewrite.append('function')
  static readonly expand = vscode.CodeActionKind.Refactor.append('expand')
  static readonly reDelFc = /[\w$[\]]+\s*\(.*\)/
  static readonly reSwapVar = /^\[(?:[^,]+,)+.*\]$/s

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Selection | vscode.Range,
    context: vscode.CodeActionContext,
    // token: vscode.CancellationToken,
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    if (context.triggerKind !== vscode.CodeActionTriggerKind.Invoke) {
      return
    }

    if (!range.isEmpty) {
      return (
        SelectionCodeActionsProvider.provideDeleteFunctionCall(
          document,
          range as vscode.Selection,
        ) ??
        SelectionCodeActionsProvider.provideSwapVar(
          document,
          range as vscode.Selection,
        )
      )
    }
  }

  //#region static
  static provideDeleteFunctionCall(
    document: vscode.TextDocument,
    selection: vscode.Selection,
  ) {
    if (
      !SelectionCodeActionsProvider.reDelFc.test(document.getText(selection))
    ) {
      return
    }

    const delFcSnippet = new vscode.SnippetString(
      '${TM_SELECTED_TEXT/^\\s*.+?\\((.*)\\)\\s*$/$1/s}',
    )
    const wspEdit = new vscode.WorkspaceEdit()
    wspEdit.set(document.uri, [
      new vscode.SnippetTextEdit(selection, delFcSnippet),
    ])

    const codeAction = new vscode.CodeAction(
      'Delete Function Call',
      SelectionCodeActionsProvider.rewriteFunction,
    )
    codeAction.edit = wspEdit

    return [codeAction]
  }

  static provideSwapVar(
    document: vscode.TextDocument,
    selection: vscode.Selection,
  ) {
    if (
      !SelectionCodeActionsProvider.reSwapVar.test(document.getText(selection))
    ) {
      return
    }

    const wspEdit = new vscode.WorkspaceEdit()
    wspEdit.set(document.uri, [
      new vscode.TextEdit(
        selection,
        SelectionCodeActionsProvider.swapVar(document.getText(selection)),
      ),
    ])

    const codeAction = new vscode.CodeAction(
      'Swap Variables',
      SelectionCodeActionsProvider.expand,
    )
    codeAction.edit = wspEdit

    return [codeAction]
  }

  static swapVar(text: string) {
    return (
      text + ' = [' + text.slice(1, -1).split(',').reverse().join(',') + ']'
    )
  }

  static register(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        LangIds.langIdJsOrJsx,
        new SelectionCodeActionsProvider(),
        {
          providedCodeActionKinds: [
            SelectionCodeActionsProvider.rewriteFunction,
            SelectionCodeActionsProvider.expand,
          ],
        },
      ),
    )
  }
  //#endregion
}
