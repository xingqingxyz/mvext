import { type ExtensionContext, commands } from 'vscode'
import {
  applyShellEdit,
  applyTerminalEdit,
  applyTerminalFilter,
} from './applyShellEdit'
import { setExtContext } from './context'
import { DictionaryCompleteProvider } from './dictionaryComplete'
import { ShfmtFormatter } from './formatter/shfmt'
import { StyluaFormatter } from './formatter/stylua.old'
import { HexColorProvider } from './hexColor'
import { LineCompleteProvider } from './lineComplete'
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
    HexColorProvider.finallyInit!(),
    new PathCompleteProvider(),
    new LineCompleteProvider(),
    new DictionaryCompleteProvider(),
    new SelectionCodeActionsProvider(),
    new StyluaFormatter(),
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
    commands.registerCommand('mvext.quicklySwitchFile', quicklySwitchFile),
    commands.registerCommand('mvext.applyShellEdit', applyShellEdit),
    commands.registerCommand('mvext.applyTerminalEdit', applyTerminalEdit),
    commands.registerCommand('mvext.applyTerminalFilter', applyTerminalFilter),
    commands.registerCommand('mvext.applyTerminalRun', (...args) =>
      commands.executeCommand(
        'workbench.action.terminal.runSelectedText',
        ...args,
      ),
    ),
  )
}
