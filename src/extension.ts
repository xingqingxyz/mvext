import vscode from 'vscode'
import { registerCaseTransform } from './caseTransform'
import { registerEvalWithSelection } from './evalWithSelection'
import { registerQuicklySwitchFile } from './quicklySwitchFile'
import { registerTsCodeActions } from './tsCodeActions'
import { setupExtConfig } from './utils/getExtConfig'

export function activate(context: vscode.ExtensionContext) {
  console.log('My VSCode Extension activated.')
  setupExtConfig(context)
  registerCaseTransform(context)
  registerQuicklySwitchFile(context)
  registerEvalWithSelection(context)
  registerTsCodeActions(context)
}

export function deactivate() {
  console.log('My VSCode Extension deactivated.')
}
