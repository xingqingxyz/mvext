import { ExtensionContext, commands } from 'vscode'
import {
  applyCurrentShellEdit,
  applyShellEdit,
  applyShellFilter,
} from './applyShellEdit'
import { setExtContext } from './context'
import { register as registerCssSeletorComplete } from './cssSelectorComplete'
import { PathCompleteProvider } from './pathComplete'
import { quicklySwitchFile } from './quicklySwitchFile'
import { renameWithCase, transformCase } from './transformCase'
import { register as registerTsCodeAction } from './tsCodeActions/selection'

export function activate(context: ExtensionContext) {
  setExtContext(context)
  registerCssSeletorComplete()
  registerTsCodeAction()
  context.subscriptions.push(
    new PathCompleteProvider(),
    commands.registerCommand('mvext.renameWithCase', renameWithCase),
    commands.registerTextEditorCommand('mvext.transformCase', transformCase),
    commands.registerCommand('mvext.quicklySwitchFile', quicklySwitchFile),
    commands.registerCommand('mvext.applyShellEdit', applyShellEdit),
  )
  if (__DEV__) {
    context.subscriptions.push(
      commands.registerCommand(
        'mvext.applyCurrentShellEdit',
        applyCurrentShellEdit,
      ),
      commands.registerCommand('mvext.applyShellFilter', applyShellFilter),
    )
  }
}
