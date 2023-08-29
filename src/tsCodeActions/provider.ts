import vscode from 'vscode'
import { selectionCodeActions } from './selection'

export default function provideCodeActions(
  document: vscode.TextDocument,
  range: vscode.Selection | vscode.Range,
  context: vscode.CodeActionContext,
  // token: vscode.CancellationToken,
): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
  if (context.triggerKind !== vscode.CodeActionTriggerKind.Invoke) return

  const result: vscode.CodeAction[] = []
  if (!range.isEmpty) {
    let ret: vscode.CodeAction | undefined
    selectionCodeActions.forEach(
      (action) =>
        (ret = action(document, range as vscode.Selection)) && result.push(ret),
    )
  }

  return result
}
