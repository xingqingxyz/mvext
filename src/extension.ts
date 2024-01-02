import { ExtensionContext, commands } from 'vscode'
import {
  applyCurrentShellEdit,
  applyShellEdit,
  applyShellFilter,
} from './applyShellEdit'
import { register as registerCaseTransform } from './caseTransform'
import { setExtContext } from './context'
import { register as registerCssSeletorComplete } from './cssSelectorComplete'
import { PathCompleteProvider } from './pathComplete'
import { quicklySwitchFile } from './quicklySwitchFile'
import { register as registerTsCodeAction } from './tsCodeActions/selection'

export function activate(context: ExtensionContext) {
  setExtContext(context)
  PathCompleteProvider.register!()
  registerCssSeletorComplete()
  registerCaseTransform()
  registerTsCodeAction()
  context.subscriptions.push(
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
