import vscode from 'vscode'
import { selectionCodeActions } from './selection'

export default function provideCodeActions(
  document: vscode.TextDocument,
  range: vscode.Selection | vscode.Range,
  context: vscode.CodeActionContext,
  // token: vscode.CancellationToken,
): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
  if (context.triggerKind !== vscode.CodeActionTriggerKind.Invoke) return

  const result: ReturnType<typeof provideCodeActions> = []
  if (!range.isEmpty) {
    for (const action of selectionCodeActions) {
      const ret = action(document, range as vscode.Selection)
      if (ret) {
        result.push(ret)
      }
    }
  }

  return result
}
