import fs from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import {
  commands,
  extensions,
  window,
  type Extension,
  type ExtensionContext,
} from 'vscode'
import type { IPowerShellExtensionClient } from './ExternalApi'

let ipcPath: string
export let powershellExtension:
  | Extension<IPowerShellExtensionClient>
  | undefined

export async function registerPowershellExtension(context: ExtensionContext) {
  powershellExtension = extensions.getExtension<IPowerShellExtensionClient>(
    'ms-vscode.powershell',
  )
  if (!powershellExtension) {
    throw 'requires vscode extension: ms-vscode.powershell'
  }
  if (!powershellExtension.isActive) {
    await powershellExtension.activate()
  }
  const powerShellExtensionClient = powershellExtension.exports
  const extensionId = powerShellExtensionClient.registerExternalExtension(
    context.extension.id,
  )
  await powerShellExtensionClient.waitUntilStarted(extensionId)
  await commands.executeCommand('PowerShell.ShowSessionConsole')
  ipcPath = path.join(
    tmpdir(),
    'mvext.sendAstTreeJson-' + Math.random().toFixed(6).slice(2),
  )
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _ of window
    .activeTerminal!.shellIntegration!.executeCommand('&', [
      context.asAbsolutePath('resources/registerEditorCommands.ps1'),
      '-IpcPath',
      ipcPath,
    ])
    .read()) {
  }
}

type PowerShellEditorCommands =
  | 'mvext.sendAstTreeJson'
  | 'mvext.provideCodeActions'

export async function requestEditorCommand<T>(
  commandName: PowerShellEditorCommands,
) {
  if (!powershellExtension) {
    throw 'powershell extension not registered'
  }
  await commands.executeCommand('PowerShell.InvokeRegisteredEditorCommand', {
    commandName,
  })
  return JSON.parse(await fs.readFile(ipcPath, 'utf8')) as T
}
