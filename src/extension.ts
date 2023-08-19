import vscode from 'vscode'
import { registerCaseTransform } from './caseTransform'
import { registerSwitchFile } from './switchFile'
import { registerTsCodeActions } from './tsCodeActions'
import { registerEvalWithSelection } from './evalWithSelection'

export function activate(context: vscode.ExtensionContext) {
  console.log('My Extension activated.')
  registerCaseTransform(context)
  registerSwitchFile(context)
  registerTsCodeActions(context)
  registerEvalWithSelection(context)
}

export function deactivate() {
  console.log('My Extension deactivated.')
}
