import * as vscode from 'vscode'

export function getPrevCharAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
) {
  return document.getText(
    new vscode.Range(
      position.with({
        character: position.character - 5,
      }),
      position,
    ),
  )
}
