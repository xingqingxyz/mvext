import {
  CodeAction,
  CodeActionKind,
  CodeActionTriggerKind,
  SnippetString,
  SnippetTextEdit,
  TextEdit,
  WorkspaceEdit,
  languages,
  type CancellationToken,
  type CodeActionContext,
  type CodeActionProvider,
  type Command,
  type Disposable,
  type ProviderResult,
  type Range,
  type Selection,
  type TextDocument,
} from 'vscode'

function swapVarHelper(text: string) {
  text = text.trim().replace(/^\[|\]$/g, '')
  const rev = text.split(/,\s*/).reverse().join(', ')
  return `[${text}] = [${rev}]`
}

export class SelectionCodeActionsProvider
  implements CodeActionProvider, Disposable
{
  static readonly reDelFc = /^\s*[\w$[\]'"]+\s*\(.*\)\s*$/
  static readonly allKinds = {
    function: CodeActionKind.RefactorRewrite.append('function'),
    transform: CodeActionKind.Refactor.append('transform'),
  }

  dispose: () => void

  constructor() {
    this.dispose = languages.registerCodeActionsProvider(
      ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
      this,
      {
        providedCodeActionKinds: Object.values(
          SelectionCodeActionsProvider.allKinds,
        ),
      },
    ).dispose
  }

  provideCodeActions(
    document: TextDocument,
    range: Selection | Range,
    context: CodeActionContext,
    token: CancellationToken,
  ): ProviderResult<(CodeAction | Command)[]> {
    if (context.triggerKind !== CodeActionTriggerKind.Invoke) {
      return
    }

    if (!range.isEmpty) {
      const text = document.getText(range)
      if (SelectionCodeActionsProvider.reDelFc.test(text)) {
        return SelectionCodeActionsProvider.delFc(document, range as Selection)
      } else if (text.includes(',')) {
        return SelectionCodeActionsProvider.swapVar(
          document,
          range as Selection,
        )
      }
    }
  }

  //#region static
  static delFc(document: TextDocument, range: Selection) {
    const delFcSnippet = new SnippetString(
      '${TM_SELECTED_TEXT/^\\s*.+?\\((.*)\\)\\s*$/$1/s}',
    )
    const wspEdit = new WorkspaceEdit()
    wspEdit.set(document.uri, [new SnippetTextEdit(range, delFcSnippet)])

    const codeAction = new CodeAction(
      'Delete Function Call',
      SelectionCodeActionsProvider.allKinds.function,
    )
    codeAction.edit = wspEdit

    return [codeAction]
  }

  static swapVar(document: TextDocument, range: Selection) {
    const wspEdit = new WorkspaceEdit()
    wspEdit.set(document.uri, [
      new TextEdit(range, swapVarHelper(document.getText(range))),
    ])

    const codeAction = new CodeAction(
      'Swap Variable',
      SelectionCodeActionsProvider.allKinds.transform,
    )
    codeAction.edit = wspEdit

    return [codeAction]
  }
  //#endregion
}
