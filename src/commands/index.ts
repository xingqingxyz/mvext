import * as vscode from 'vscode'
import { BaseLanguageClient } from 'vscode-languageclient'
import * as conversionCommands from './conversion'
import * as schemaCommands from './schema'

export function registerCommands(
  ctx: vscode.ExtensionContext,
  c: BaseLanguageClient
) {
  conversionCommands.register(ctx, c)
  schemaCommands.register(ctx, c)
}
