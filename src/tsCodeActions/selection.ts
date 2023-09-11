import vscode from 'vscode'

const allCodeActionKind = {
  function: vscode.CodeActionKind.RefactorRewrite.append('function'),
  expand: vscode.CodeActionKind.Refactor.append('expand'),
}

export const selectionCodeActions = [provideDeleteFunctionCall, provideSwapVar]

const reDelFc = /[\w$[\]]+\s*\(.*\)/
const delFcSnippet = new vscode.SnippetString(
  '${TM_SELECTED_TEXT/^\\s*.+?\\((.*)\\)\\s*$/$1/s}',
)
export function provideDeleteFunctionCall(
  document: vscode.TextDocument,
  selection: vscode.Selection,
) {
  if (!reDelFc.test(document.getText(selection))) return

  const wspEdit = new vscode.WorkspaceEdit()
  wspEdit.set(document.uri, [
    new vscode.SnippetTextEdit(selection, delFcSnippet),
  ])

  const codeAction = new vscode.CodeAction(
    'Delete Function Call',
    allCodeActionKind.function,
  )
  codeAction.edit = wspEdit

  return codeAction
}

function swapVar(text: string) {
  return text + ' = [' + text.slice(1, -1).split(',').reverse().join(',') + ']'
}

const reSwapVar = /^\[(?:[^,]+,)+.*\]$/s
export function provideSwapVar(
  document: vscode.TextDocument,
  selection: vscode.Selection,
) {
  if (!reSwapVar.test(document.getText(selection))) return

  const wspEdit = new vscode.WorkspaceEdit()
  wspEdit.set(document.uri, [
    new vscode.TextEdit(selection, swapVar(document.getText(selection))),
  ])

  const codeAction = new vscode.CodeAction(
    'Swap Variables',
    allCodeActionKind.expand,
  )
  codeAction.edit = wspEdit

  return codeAction
}
