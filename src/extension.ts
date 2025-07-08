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
import { MarkdownBlockRunProvider } from './markdownBlockRun'
import { PathCompleteProvider } from './pathComplete'
import { terminalLaunch, terminalLaunchArgs } from './terminalLaunch'
import {
  renameWithCase,
  transformCaseDefault,
  transformCaseWithPicker,
} from './transformCase'
import { SelectionCodeActionsProvider } from './tsCodeAction/selection'
import { terminalRunCode } from './util/terminalRunCode'

export async function activate(context: ExtensionContext) {
  setExtContext(context)
  HexColorProvider.init()
  new StyluaFormatter()
  new ShfmtFormatter()
  new PathCompleteProvider()
  new MarkdownBlockRunProvider()
  new SelectionCodeActionsProvider()
  context.subscriptions.push(
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
