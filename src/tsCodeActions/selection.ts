import vscode from 'vscode'

const allCodeActionKind = {
  function: vscode.CodeActionKind.RefactorRewrite.append('function'),
  expand: vscode.CodeActionKind.RefactorRewrite.append('expand'),
}

export const selectionCodeActions = [provideDeleteFunctionCall, provideSwapVar]

export function provideDeleteFunctionCall(
  document: vscode.TextDocument,
  selection: vscode.Selection,
) {
  if (!/[\w$[\]]+\s*\(.*\)/.test(document.getText(selection))) return

  const wspEdit = new vscode.WorkspaceEdit()
  wspEdit.set(document.uri, [
    new vscode.SnippetTextEdit(
      selection,
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

  return codeAction
}

function swapVar(text: string) {
  return text + ' = [' + text.slice(1, -1).split(',').reverse().join(',') + ']'
}

export function provideSwapVar(
  document: vscode.TextDocument,
  selection: vscode.Selection,
) {
  if (!/^\[(?:[^,]+,)+.*\]$/s.test(document.getText(selection))) return

  const wspEdit = new vscode.WorkspaceEdit()
  wspEdit.set(document.uri, [
    new vscode.TextEdit(selection, swapVar(document.getText(selection))),
  ])

  const codeAction = new vscode.CodeAction(
    vscode.l10n.t('Swap Variables'),
    allCodeActionKind.expand,
  )
  codeAction.edit = wspEdit

  return codeAction
}
