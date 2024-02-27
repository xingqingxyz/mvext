import { ExtensionContext, commands } from 'vscode'
import {
  applyShellEdit,
  applyTerminalEdit,
  applyTerminalFilter,
} from './applyShellEdit'
import { setExtContext } from './context'
import { CssSelectorCompleteProvider } from './cssSelectorComplete'
import { PathCompleteProvider } from './pathComplete'
import { quicklySwitchFile } from './quicklySwitchFile'
import {
  renameWithCase,
  transformCase,
  transformCaseWithPicker,
} from './transformCase'
import { SelectionCodeActionsProvider } from './tsCodeActions/selection'

export function activate(context: ExtensionContext) {
  setExtContext(context)
  context.subscriptions.push(
    new PathCompleteProvider(),
    new SelectionCodeActionsProvider(),
    new CssSelectorCompleteProvider(),
    commands.registerCommand('mvext.renameWithCase', renameWithCase),
    commands.registerTextEditorCommand('mvext.transformCase', transformCase),
    commands.registerCommand(
      'mvext.transformCaseWithPicker',
      transformCaseWithPicker,
    ),
    commands.registerCommand('mvext.applyShellEdit', applyShellEdit),
    commands.registerCommand('mvext.quicklySwitchFile', quicklySwitchFile),
  )
  if (__DEV__) {
    context.subscriptions.push(
      commands.registerCommand('mvext.applyTerminalEdit', applyTerminalEdit),
      commands.registerCommand(
        'mvext.applyTerminalFilter',
        applyTerminalFilter,
      ),
    )
  }
}
