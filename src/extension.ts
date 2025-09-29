import '@/shims/web'
import { commands, env, type ExtensionContext } from 'vscode'
import { InvokeCompleteProvider } from './completion'
import { getExtConfig } from './config'
import {
  evalSelection,
  terminalEvalSelection,
  terminalFilterSelection,
} from './evalSelection'
import { ShfmtFormatter, ShfmtFormatterWasm } from './formatter/shfmt'
import { StyluaFormatter, StyluaFormatterWasm } from './formatter/stylua'
import { HexColorProvider } from './hexColor'
import { copyJsonPath } from './jsonPath'
import { MarkdownBlockRunProvider } from './markdownBlockRun'
import { registerPwshAstTreeView } from './pwshAstTreeView'
import { registerTerminalLaunch } from './terminalLaunch'
import {
  renameWithCase,
  transformCaseDefault,
  transformCaseWithPicker,
} from './transformCase'
import { TransformCodeActionProvider } from './tsCodeAction/provider'
import { initTSParser } from './tsParser'
import { registerTSTreeView } from './tsTreeView'
import { terminalRunCode } from './util/terminalRunCode'

export async function activate(context: ExtensionContext) {
  await initTSParser(context)
  registerTSTreeView(context)
  registerTerminalLaunch(context)
  HexColorProvider.init(context)
  new InvokeCompleteProvider(context)
  new TransformCodeActionProvider(context)
  new MarkdownBlockRunProvider(context)
  if (__WEB__) {
    if (getExtConfig('shfmt.enabled')) {
      new ShfmtFormatterWasm(context)
    }
    if (getExtConfig('stylua.enabled')) {
      new StyluaFormatterWasm(context)
    }
  } else {
    if (getExtConfig('shfmt.enabled')) {
      new ShfmtFormatter(context)
    }
    if (getExtConfig('stylua.enabled')) {
      new StyluaFormatter(context)
    }
    if (getExtConfig('pwshAstTreeView.enabled')) {
      registerPwshAstTreeView(context)
    }
  }
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
    commands.registerCommand('mvext.copyJsonPath', copyJsonPath),
    ...(__WEB__
      ? []
      : [commands.registerCommand('mvext.evalSelection', evalSelection)]),
  )
}
