import * as vscode from 'vscode'
import { registerApplyShellEdit } from './applyShellEdit'
import { registerBatCompletion } from './batCompletion'
import { registerCaseTransform } from './caseTransform'
import { registerQuicklySwitchFile } from './quicklySwitchFile'
import { registerShfmt } from './shfmt'
import { registerTsCodeActions } from './tsCodeActions'
import { setupExtConfig } from './utils/getExtConfig'

export function activate(context: vscode.ExtensionContext) {
  console.log('My VSCode Extension activated.')
  setupExtConfig(context)
  registerCaseTransform(context)
  registerQuicklySwitchFile(context)
  registerApplyShellEdit(context)
  registerTsCodeActions(context)
  registerBatCompletion(context)
  registerShfmt(context)
}

export function deactivate() {
  console.log('My VSCode Extension deactivated.')
}
