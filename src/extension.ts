import { type ExtensionContext, commands } from 'vscode'
import {
  applyShellEdit,
  applyTerminalEdit,
  applyTerminalFilter,
} from './applyShellEdit'
import { setExtContext } from './context'
import { ShfmtFormatter } from './formatter/shfmt'
import { StyluaFormatter2 } from './formatter/stylua'
import { HexColorProvider } from './hexColor'
import { PathCompleteProvider } from './pathComplete'
import { quicklySwitchFile } from './quicklySwitchFile'
import {
  renameWithCase,
  transformCaseDefault,
  transformCaseWithPicker,
} from './transformCase'
import { SelectionCodeActionsProvider } from './tsCodeActions/selection'

export function activate(context: ExtensionContext) {
  setExtContext(context)
  context.subscriptions.push(
    HexColorProvider.getOnce!(),
    new PathCompleteProvider(),
    new SelectionCodeActionsProvider(),
    new StyluaFormatter2(),
    new ShfmtFormatter(),
    // new CssSelectorCompleteProvider(),
    commands.registerCommand('mvext.renameWithCase', renameWithCase),
    commands.registerTextEditorCommand(
      'mvext.transformCaseDefault',
      transformCaseDefault,
    ),
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
