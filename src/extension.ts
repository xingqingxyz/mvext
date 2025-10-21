import '@/shims/web'
import { commands, env, type ExtensionContext } from 'vscode'
import { TransformCodeActionProvider } from './codeAction/javascript/provider'
import { InvokeCompleteProvider } from './completion'
import { PathCompleteProvider } from './completion/path'
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
import { PwshAstTreeDataProvier } from './pwshAstTreeView'
import { registerTerminalLaunch } from './terminalLaunch'
import {
  renameWithCase,
  transformCaseDefault,
  transformCaseWithPicker,
} from './transformCase'
import { initTSParser } from './tsParser'
import { TSTreeDataProvier } from './tsTreeView'
import { execScript } from './util/execScript'
import { logger } from './util/logger'
import { terminalRunCode } from './util/terminalRunCode'

export async function activate(context: ExtensionContext) {
  await initTSParser(context)
  registerTerminalLaunch(context)
  HexColorProvider.init(context)
  new TSTreeDataProvier(context)
  new TransformCodeActionProvider(context)
  new InvokeCompleteProvider(context)
  new PathCompleteProvider(context)
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
    if (getExtConfig('pwsh.astTreeView.enabled')) {
      new PwshAstTreeDataProvier(context)
    }
  }
  context.subscriptions.push(
    logger,
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
      : [
          commands.registerCommand('mvext.evalSelection', evalSelection),
          commands.registerCommand('mvext.execScript', execScript),
        ]),
  )
}
