import * as vscode from 'vscode'
import { registerApplyShellEdit } from './applyShellEdit'
import { registerCaseTransform } from './caseTransform'
import { registerQuicklySwitchFile } from './quicklySwitchFile'
import { registerTsCodeActions } from './tsCodeActions'
import { setupExtConfig } from './utils/getExtConfig'
import { registerPathComplete } from './pathComplete'

export function activate(context: vscode.ExtensionContext) {
  console.log('My VSCode Extension activated.')
  setupExtConfig(context)
  registerCaseTransform(context)
  registerQuicklySwitchFile(context)
  registerApplyShellEdit(context)
  registerTsCodeActions(context)
  registerPathComplete(context)
}

export function deactivate() {
  console.log('My VSCode Extension deactivated.')
}
