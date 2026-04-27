import '@/shims/web'
import { commands, env, type ExtensionContext } from 'vscode'
import { TransformCodeActionProvider } from './codeActions/javascript/provider'
import {
  evalSelection,
  terminalEvalSelection,
  terminalFilterSelection,
} from './commands/evalSelection'
import { execScript, setDtsPath } from './commands/execScript'
import { HexColorProvider } from './commands/hexColor'
import { copyJsonPath } from './commands/jsonPath'
import { MarkdownBlockRunProvider } from './commands/markdownBlockRun'
import { registerTerminalLaunch } from './commands/terminalLaunch'
import {
  renameWithCase,
  transformCase,
  transformCaseWithPicker,
} from './commands/transformCase'
import { InvokeCompletionItemProvider } from './completion'
import { PathCompletionItemProvider } from './completion/path'
import { PwshAstTreeDataProvier } from './components/powershell/astTreeView'
import { getParser, initTSParser } from './components/treeSitter/parser'
import { TSTreeDataProvier } from './components/treeSitter/treeView'
import { getExtConfig } from './config'
import type { ExternalApi } from './ExternalApi'
import { ShfmtFormatter, ShfmtFormatterWasm } from './formatter/shfmt'
import { StyluaFormatter, StyluaFormatterWasm } from './formatter/stylua'
import { logger } from './util/logger'
import { transformCaseHelper } from './util/transformCaseHelper'
export type { ExternalApi } from './ExternalApi'

export async function activate(
  context: ExtensionContext,
): Promise<ExternalApi> {
  await initTSParser(context)
  await registerTerminalLaunch(context)
  HexColorProvider.init(context)
  new TSTreeDataProvier(context)
  new TransformCodeActionProvider(context)
  new InvokeCompletionItemProvider(context)
  new PathCompletionItemProvider(context)
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
    setDtsPath(context.asAbsolutePath('resources/global.vscode.d.ts'))
  }
  context.subscriptions.push(
    logger,
    commands.registerCommand('mvext._copyCodeBlock', (text: string) =>
      env.clipboard.writeText(text),
    ),
    commands.registerTextEditorCommand('mvext.transformCase', transformCase),
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
  return {
    transformCaseHelper,
    getParser,
  }
}
