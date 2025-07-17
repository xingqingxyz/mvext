import { type ExtensionContext, commands, env, workspace } from 'vscode'
import { InvokeCompleteProvider } from './completion'
import { getExtConfig } from './config'
import { ContextKey } from './context'
import {
  evalSelection,
  terminalEvalSelection,
  terminalFilterSelection,
} from './evalSelection'
import { ShfmtFormatter } from './formatter/shfmt'
import { StyluaFormatter } from './formatter/stylua'
import { HexColorProvider } from './hexColor'
import { MarkdownBlockRunProvider } from './markdownBlockRun'
import { registerRunList } from './runList'
import { terminalLaunch, terminalLaunchArgs } from './terminalLaunch'
import {
  renameWithCase,
  transformCaseDefault,
  transformCaseWithPicker,
} from './transformCase'
import { SelectionCodeActionsProvider } from './tsCodeAction/selection'
import { terminalRunCode } from './util/terminalRunCode'
import { TSParser } from './util/tsParser'

export async function activate(context: ExtensionContext) {
  await TSParser.init(context)
  await TSParser.createParser('css')
  registerRunList(context)
  HexColorProvider.init(context)
  new InvokeCompleteProvider(context)
  new StyluaFormatter(context)
  new ShfmtFormatter(context)
  new MarkdownBlockRunProvider(context)
  new SelectionCodeActionsProvider(context)
  context.subscriptions.push(
    commands.registerCommand('mvext.terminalRunCode', terminalRunCode),
    commands.registerCommand('mvext._copyCodeBlock', (text: string) =>
      env.clipboard.writeText(text),
    ),
    commands.registerTextEditorCommand(
      'mvext.transformCaseDefault',
      transformCaseDefault,
    ),
    commands.registerCommand(
      'mvext.transformCaseWithPicker',
      transformCaseWithPicker,
    ),
    commands.registerCommand('mvext.renameWithCase', renameWithCase),
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
    commands.registerCommand('mvext.terminalLaunchArgs', (uri) =>
      terminalLaunchArgs(context, uri),
    ),
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
