import vscode from 'vscode'

export function cfgEvalWithSelection() {
  return vscode.workspace.getConfiguration('mvext.evalWithSelection')
}
