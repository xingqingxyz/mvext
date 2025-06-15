import {
  type ExtensionContext,
  commands,
  env,
  languages,
  workspace,
} from 'vscode'
import { getExtConfig } from './config'
import { ContextKey, setExtContext } from './context'
import { DictionaryCompleteProvider } from './dictionaryComplete'
import {
  evalSelection,
  terminalEvalSelection,
  terminalFilterSelection,
} from './evalSelection'
import { ShfmtFormatter } from './formatter/shfmt'
import { StyluaFormatter } from './formatter/stylua'
import { HexColorProvider } from './hexColor'
import { MarkdownBlockRunProvider, runCodeBlock } from './markdownBlockRun'
import { PathCompleteProvider } from './pathComplete'
import { terminalLaunch, terminalLaunchArgs } from './terminalLaunch'
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
    commands.registerCommand('mvext.evalSelection', evalSelection),
    commands.registerCommand(
      'mvext.terminalEvalSelection',
      terminalEvalSelection,
    ),
    commands.registerCommand(
      'mvext.terminalFilterSelection',
      terminalFilterSelection,
    ),
    commands.registerCommand('mvext.terminalRunSelection', () =>
      commands.executeCommand('workbench.action.terminal.runSelectedText'),
    ),
    commands.registerCommand('mvext.terminalLaunch', terminalLaunch),
    commands.registerCommand('mvext.terminalLaunchArgs', terminalLaunchArgs),
    workspace.onDidChangeConfiguration(
      (e) =>
        e.affectsConfiguration('mvext.terminalLaunch.languages') &&
        commands.executeCommand(
          'setContext',
          ContextKey.terminalLaunchLanguages,
          Object.keys(getExtConfig('terminalLaunch.languages')),
        ),
    ),
  )
  return commands.executeCommand(
    'setContext',
    ContextKey.terminalLaunchLanguages,
    Object.keys(getExtConfig('terminalLaunch.languages')),
  )
}
