import vscode from 'vscode'
import { register } from './api'
export function activate(context: vscode.ExtensionContext) {
  console.log('My Extension activated.')
  register(context)
}
export function deactivate() {
  console.log('My Extension deactivated.')
}
