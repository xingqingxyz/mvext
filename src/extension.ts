import vscode from 'vscode'
import { registerCaseTransform } from './caseTransform'
import { registerSwitchFile } from './switchFile'
import { registerTsCodeActions } from './tsCodeActions'

export function activate(context: vscode.ExtensionContext) {
  console.log('My Extension activated.')
  registerCaseTransform(context)
  registerSwitchFile(context)
  registerTsCodeActions(context)
}

export function deactivate() {
  console.log('My Extension deactivated.')
}
