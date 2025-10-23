import '@/shims/web'
import { commands, env, type ExtensionContext } from 'vscode'
import { TransformCodeActionProvider } from './codeActions/javascript/provider'
import {
  evalSelection,
  terminalEvalSelection,
  terminalFilterSelection,
} from './commands/evalSelection'
import { execScript } from './commands/execScript'
import { HexColorProvider } from './commands/hexColor'
import { copyJsonPath } from './commands/jsonPath'
import { MarkdownBlockRunProvider } from './commands/markdownBlockRun'
import { registerTerminalLaunch } from './commands/terminalLaunch'
import {
  renameWithCase,
  transformCaseDefault,
  transformCaseWithPicker,
} from './commands/transformCase'
import { InvokeCompleteProvider } from './completion'
import { PathCompleteProvider } from './completion/path'
import { getExtConfig } from './config'
import { ShfmtFormatter, ShfmtFormatterWasm } from './formatter/shfmt'
import { StyluaFormatter, StyluaFormatterWasm } from './formatter/stylua'
import { initTSParser } from './ts/parser'
import { TSTreeDataProvier } from './ts/treeView'
import { logger } from './util/logger'
import { terminalRunCode } from './util/terminalRunCode'
import { PwshAstTreeDataProvier } from './vendor/powershellExtension/astTreeView'

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
          commands.registerTextEditorCommand(
            'mvext.execReference',
            (editor, edit) => {
              edit.replace(
                editor.selection,
                `/// <reference path="${context.asAbsolutePath('./resources/vscode.d.ts')}" />\n` +
                  `/// <reference path="${context.asAbsolutePath('./resources/global.vscode.d.ts')}" />\n`,
              )
            },
          ),
        ]),
  )
}
