import { ExtensionContext, commands, languages } from 'vscode'
import {
  applyShellEdit,
  applyTerminalEdit,
  applyTerminalFilter,
} from './applyShellEdit'
import { setExtContext } from './context'
import { ShfmtFormatter } from './formatter/shfmt'
import { StyluaFormatter } from './formatter/stylua'
import { HexColorProvider } from './hexColor'
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
    // new CssSelectorCompleteProvider(),
    commands.registerCommand('mvext.renameWithCase', renameWithCase),
    commands.registerTextEditorCommand('mvext.transformCase', transformCase),
    commands.registerCommand(
      'mvext.transformCaseWithPicker',
      transformCaseWithPicker,
    ),
    commands.registerCommand('mvext.applyShellEdit', applyShellEdit),
    commands.registerCommand('mvext.quicklySwitchFile', quicklySwitchFile),
    commands.registerTextEditorCommand(
      'mvext.hexColor.toggleLanguage',
      HexColorProvider.toggleHexColor.bind(HexColorProvider),
    ),
    HexColorProvider,
    languages.registerDocumentFormattingEditProvider(
      ['shellscript'],
      new ShfmtFormatter(),
    ),
    languages.registerDocumentRangeFormattingEditProvider(
      ['lua'],
      new StyluaFormatter(),
    ),
    languages.registerDocumentFormattingEditProvider(
      ['lua'],
      new StyluaFormatter(),
    ),
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
