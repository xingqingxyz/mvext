import { commands, env, type ExtensionContext } from 'vscode'
import { InvokeCompleteProvider } from './completion'
import {
  evalSelection,
  terminalEvalSelection,
  terminalFilterSelection,
} from './evalSelection'
import { ShfmtFormatter } from './formatter/shfmt'
import { StyluaFormatter } from './formatter/stylua'
import { HexColorProvider } from './hexColor'
import { MarkdownBlockRunProvider } from './markdownBlockRun'
import { terminalLaunch, terminalLaunchArgs } from './terminalLaunch'
import {
  renameWithCase,
  transformCaseDefault,
  transformCaseWithPicker,
} from './transformCase'
import { TransformCodeActionProvider } from './tsCodeAction/provider'
import { initTSParser } from './tsParser'
import { registerTSTreeView } from './tsTreeView'
import { isWeb } from './util'
import { terminalRunCode } from './util/terminalRunCode'

export async function activate(context: ExtensionContext) {
  await initTSParser(context)
  registerTSTreeView(context)
  HexColorProvider.init(context)
  new InvokeCompleteProvider(context)
  new TransformCodeActionProvider(context)
  if (!isWeb) {
    new StyluaFormatter(context)
    new ShfmtFormatter(context)
  }
  new MarkdownBlockRunProvider(context)
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
    ...(isWeb
      ? []
      : [commands.registerCommand('mvext.evalSelection', evalSelection)]),
  )
}
