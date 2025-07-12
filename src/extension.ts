import { type ExtensionContext, commands, env, workspace } from 'vscode'
import { getExtConfig } from './config'
import { ContextKey, setExtContext } from './context'
import {
  evalSelection,
  terminalEvalSelection,
  terminalFilterSelection,
} from './evalSelection'
import { ShfmtFormatter } from './formatter/shfmt'
import { StyluaFormatter } from './formatter/stylua'
import { HexColorProvider } from './hexColor'
import { InvokeCompleteProvider } from './invokeComplete'
import { MarkdownBlockRunProvider } from './markdownBlockRun'
import { terminalLaunch, terminalLaunchArgs } from './terminalLaunch'
import {
  renameWithCase,
  transformCaseDefault,
  transformCaseWithPicker,
} from './transformCase'
import { SelectionCodeActionsProvider } from './tsCodeAction/selection'
import { terminalRunCode } from './util/terminalRunCode'
import { initTreeSitter, tsParser } from './util/tsParser'

export async function activate(context: ExtensionContext) {
  setExtContext(context)
  await initTreeSitter(context)
  HexColorProvider.init()
  new InvokeCompleteProvider(context)
  new StyluaFormatter()
  new ShfmtFormatter()
  new MarkdownBlockRunProvider()
  new SelectionCodeActionsProvider()
  context.subscriptions.push(
    {
      dispose() {
        tsParser.delete()
      },
    },
    commands.registerCommand('mvext.terminalRunCode', terminalRunCode),
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
  await commands.executeCommand(
    'setContext',
    ContextKey.terminalLaunchLanguages,
    Object.keys(getExtConfig('terminalLaunch.languages')),
  )
}
