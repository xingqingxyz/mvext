import { extContext } from '@/context'
import {
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  CodeActionTriggerKind,
  Command,
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

const allKinds = {
  function: CodeActionKind.RefactorRewrite.append('function'),
  transform: CodeActionKind.Refactor.append('transform'),
}

class SelectionCodeActionsProvider implements CodeActionProvider {
  static readonly reDelFc = /^\s*[\w$[\]'"]+\s*\(.*\)\s*$/

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

    const codeAction = new CodeAction('Delete Function Call', allKinds.function)
    codeAction.edit = wspEdit

    return [codeAction]
  }

  static swapVar(document: TextDocument, range: Selection) {
    const wspEdit = new WorkspaceEdit()
    wspEdit.set(document.uri, [
      new TextEdit(range, swapVar(document.getText(range))),
    ])

    const codeAction = new CodeAction('Swap Variable', allKinds.transform)
    codeAction.edit = wspEdit

    return [codeAction]
  }
  //#endregion
}

function swapVar(text: string) {
  text = text.trim().replace(/^\[|\]$/g, '')
  const rev = text.split(/,\s*/).reverse().join(', ')
  return `[${text}] = [${rev}]`
}

export function register() {
  extContext.subscriptions.push(
    languages.registerCodeActionsProvider(
      ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
      new SelectionCodeActionsProvider(),
      {
        providedCodeActionKinds: Object.values(allKinds),
      },
    ),
  )
}
