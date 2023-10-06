import { ExtensionContext, commands } from 'vscode'
import { applyCurrentShellEdit, applyShellEdit } from './applyShellEdit'
import { registerCaseTransform } from './caseTransform'
import { PathCompleteProvider } from './pathComplete'
import { quicklySwitchFile } from './quicklySwitchFile'
import { SelectionCodeActionsProvider } from './tsCodeActions/selection'

export function activate(ctx: ExtensionContext) {
  const { registerCommand } = commands
  ctx.subscriptions.push(
    registerCommand('mvext.quicklySwitchFile', quicklySwitchFile),
    registerCommand('mvext.applyShellEdit', applyShellEdit),
    registerCommand('mvext.applyCurrentShellEdit', applyCurrentShellEdit),
  )
  registerCaseTransform(ctx)
  PathCompleteProvider.register(ctx)
  SelectionCodeActionsProvider.register(ctx)
}
