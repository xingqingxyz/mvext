import vscode from 'vscode'
import { registers } from './api'
export function activate(context: vscode.ExtensionContext) {
  console.log('My Extension Activated.')
  registers.forEach(info =>
    context.subscriptions.push(
      vscode.commands.registerCommand(info.command, info.callback)
    )
  )
}
export function deactivate() {
  console.log('My Extension deactivated.')
}
