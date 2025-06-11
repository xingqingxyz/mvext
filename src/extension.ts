import { type ExtensionContext, commands, env, languages } from 'vscode'
import {
  applyShellEdit,
  applyTerminalEdit,
  applyTerminalFilter,
} from './applyShellEdit'
import { setExtContext } from './context'
import { DictionaryCompleteProvider } from './dictionaryComplete'
import { ShfmtFormatter } from './formatter/shfmt'
import { StyluaFormatter } from './formatter/stylua'
import { HexColorProvider } from './hexColor'
import { MarkdownBlockRunProvider, runCodeBlock } from './markdownBlockRun'
import { PathCompleteProvider } from './pathComplete'
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
    new DictionaryCompleteProvider(),
    new SelectionCodeActionsProvider(),
    new StyluaFormatter(),
    new ShfmtFormatter(),
    languages.registerCodeLensProvider(
      'markdown',
      new MarkdownBlockRunProvider(),
    ),
    commands.registerCommand('mvext.runCodeBlock', runCodeBlock),
    commands.registerCommand('mvext._copyCodeBlock', (text: string) =>
      env.clipboard.writeText(text),
    ),
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
