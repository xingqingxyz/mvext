import {
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionTriggerKind,
  Command,
  ExtensionContext,
  ProviderResult,
  Range,
  Selection,
  SnippetString,
  SnippetTextEdit,
  TextDocument,
  TextEdit,
  WorkspaceEdit,
  languages,
} from 'vscode'
import { LangIds } from '@/utils'

export class SelectionCodeActionsProvider {
  static readonly rewriteFunction =
    CodeActionKind.RefactorRewrite.append('function')
  static readonly expand = CodeActionKind.Refactor.append('expand')
  static readonly reDelFc = /[\w$[\]]+\s*\(.*\)/

  provideCodeActions(
    document: TextDocument,
    range: Selection | Range,
    context: CodeActionContext,
    // token: CancellationToken,
  ): ProviderResult<(CodeAction | Command)[]> {
    if (context.triggerKind !== CodeActionTriggerKind.Invoke) {
      return
    }

    if (!range.isEmpty) {
      return (
        SelectionCodeActionsProvider.provideDeleteFunctionCall(
          document,
          range as Selection,
        ) ??
        SelectionCodeActionsProvider.provideSwapVar(
          document,
          range as Selection,
        )
      )
    }
  }

  //#region static
  static provideDeleteFunctionCall(
    document: TextDocument,
    selection: Selection,
  ) {
    if (
      !SelectionCodeActionsProvider.reDelFc.test(document.getText(selection))
    ) {
      return
    }

    const delFcSnippet = new SnippetString(
      '${TM_SELECTED_TEXT/^\\s*.+?\\((.*)\\)\\s*$/$1/s}',
    )
    const wspEdit = new WorkspaceEdit()
    wspEdit.set(document.uri, [new SnippetTextEdit(selection, delFcSnippet)])

    const codeAction = new CodeAction(
      'Delete Function Call',
      SelectionCodeActionsProvider.rewriteFunction,
    )
    codeAction.edit = wspEdit

    return [codeAction]
  }

  static provideSwapVar(document: TextDocument, selection: Selection) {
    const text = document.getText(selection)
    if (!text.includes(',')) {
      return
    }

    const wspEdit = new WorkspaceEdit()
    wspEdit.set(document.uri, [
      new TextEdit(selection, SelectionCodeActionsProvider.swapVar(text)),
    ])

    const codeAction = new CodeAction(
      'Swap Variables',
      SelectionCodeActionsProvider.expand,
    )
    codeAction.edit = wspEdit

    return [codeAction]
  }

  static swapVar(text: string) {
    text = text.trim().replace(/^\[|\]$/g, '')
    const rev = text.split(',').reverse().join(',')
    return `[${text}] = [${rev}]`
  }

  static register(ctx: ExtensionContext) {
    ctx.subscriptions.push(
      languages.registerCodeActionsProvider(
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
