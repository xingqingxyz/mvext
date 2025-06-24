import { extContext } from '@/context'
import {
  CodeAction,
  CodeActionTriggerKind,
  TextEdit,
  WorkspaceEdit,
  languages,
  type CancellationToken,
  type CodeActionContext,
  type CodeActionProvider,
  type Command,
  type ProviderResult,
  type Range,
  type Selection,
  type TextDocument,
} from 'vscode'
import { kindFunction, kindTransform } from '.'

function swapVarHelper(text: string) {
  text = text.trim().replace(/^\[|\]$/g, '')
  const rev = text.split(/,\s*/).reverse().join(', ')
  return `[${text}] = [${rev}]`
}

export class SelectionCodeActionsProvider implements CodeActionProvider {
  static readonly reDelFunc = /^\s*[\w$[\]'"]+\s*\(.*\)\s*$/
  constructor() {
    extContext.subscriptions.push(
      languages.registerCodeActionsProvider(
        ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
        this,
        {
          providedCodeActionKinds: [kindFunction, kindTransform],
        },
      ),
    )
  }
  provideCodeActions(
    document: TextDocument,
    range: Selection | Range,
    context: CodeActionContext,
    token: CancellationToken,
  ): ProviderResult<(CodeAction | Command)[]> {
    if (context.triggerKind !== CodeActionTriggerKind.Invoke || range.isEmpty) {
      return
    }
    const text = document.getText(range)
    switch (true) {
      case text.includes(','):
        return SelectionCodeActionsProvider.swapVar(document, range)
      default:
        return
    }
  }

  //#region static
  static swapVar(document: TextDocument, range: Range) {
    const wspEdit = new WorkspaceEdit()
    wspEdit.set(document.uri, [
      new TextEdit(range, swapVarHelper(document.getText(range))),
    ])
    const codeAction = new CodeAction('Swap Variable', kindTransform)
    codeAction.edit = wspEdit
    return [codeAction]
  }
  //#endregion
}
