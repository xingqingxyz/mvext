import * as vscode from 'vscode'
import { registerApplyShellEdit } from './applyShellEdit'
import { registerCaseTransform } from './caseTransform'
import { PathCompleteProvider } from './pathComplete'
import { registerQuicklySwitchFile } from './quicklySwitchFile'
import { SelectionCodeActionsProvider } from './tsCodeActions/selection'
import { setupExtConfig } from './utils/getExtConfig'

export function activate(context: vscode.ExtensionContext) {
  console.log('My VSCode Extension activated.')
  setupExtConfig(context)
  registerCaseTransform(context)
  registerApplyShellEdit(context)
  registerQuicklySwitchFile(context)
  PathCompleteProvider.register(context)
  SelectionCodeActionsProvider.register(context)
}

export function deactivate() {
  console.log('My VSCode Extension deactivated.')
}
