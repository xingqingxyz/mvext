import * as vscode from 'vscode'
import { registerApplyShellEdit } from './applyShellEdit'
import { registerCaseTransform } from './caseTransform'
import { PathCompleteProvider } from './pathComplete'
import { registerQuicklySwitchFile } from './quicklySwitchFile'
import { registerTsCodeActions } from './tsCodeActions'
import { setupExtConfig } from './utils/getExtConfig'
import { CssSelectorCompleteProvider } from './cssSelectorComplete'

export function activate(context: vscode.ExtensionContext) {
  console.log('My VSCode Extension activated.')
  setupExtConfig(context)
  registerCaseTransform(context)
  registerQuicklySwitchFile(context)
  registerApplyShellEdit(context)
  registerTsCodeActions(context)
  PathCompleteProvider.register(context)
  CssSelectorCompleteProvider.register(context)
}

export function deactivate() {
  console.log('My VSCode Extension deactivated.')
}
