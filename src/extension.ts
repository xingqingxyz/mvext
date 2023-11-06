import { ExtensionContext, commands } from 'vscode'
import { applyCurrentShellEdit, applyShellEdit } from './applyShellEdit'
import { registerCaseTransform } from './caseTransform'
import { PathCompleteProvider } from './pathComplete'
import { quicklySwitchFile } from './quicklySwitchFile'
import { SelectionCodeActionsProvider } from './tsCodeActions/selection'
import { isDesktop } from './utils'

export function activate(ctx: ExtensionContext) {
  const { registerCommand } = commands
  ctx.subscriptions.push(
    registerCommand('mvext.quicklySwitchFile', quicklySwitchFile),
  )
  if (isDesktop) {
    ctx.subscriptions.push(
      registerCommand('mvext.applyShellEdit', applyShellEdit),
    )
    if (__DEV__) {
      ctx.subscriptions.push(
        registerCommand('mvext.applyCurrentShellEdit', applyCurrentShellEdit),
      )
    }
  }
  registerCaseTransform(ctx)
  PathCompleteProvider.register(ctx)
  SelectionCodeActionsProvider.register(ctx)
}
