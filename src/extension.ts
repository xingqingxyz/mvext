import vscode from 'vscode'
import { registerApplyShellEdit } from './applyShellEdit'
import { registerCaseTransform } from './caseTransform'
import { registerQuicklySwitchFile } from './quicklySwitchFile'
import { registerTsCodeActions } from './tsCodeActions'
import { setupExtConfig } from './utils/getExtConfig'
import { registerBatCompletion } from './batCompletion'
import { registerShfmt } from './shfmt'

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
