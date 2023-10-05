import { ExtensionContext } from 'vscode'
import { registerApplyShellEdit } from './applyShellEdit'
import { registerCaseTransform } from './caseTransform'
import { PathCompleteProvider } from './pathComplete'
import { registerQuicklySwitchFile } from './quicklySwitchFile'
import { SelectionCodeActionsProvider } from './tsCodeActions/selection'

export function activate(ctx: ExtensionContext) {
  registerCaseTransform(ctx)
  registerApplyShellEdit(ctx)
  registerQuicklySwitchFile(ctx)
  PathCompleteProvider.register(ctx)
  SelectionCodeActionsProvider.register(ctx)
}
