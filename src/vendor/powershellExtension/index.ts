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
  ipcPath = path.join(
    tmpdir(),
    'mvext.sendAstTreeJson-' + Math.random().toFixed(6).slice(2),
  )
  powershellExtension = extensions.getExtension<IPowerShellExtensionClient>(
    'ms-vscode.powershell',
  )
  if (!powershellExtension) {
    if (
      !(await window.showInformationMessage(
        'requires extension: ms-vscode.powershell',
        'Install',
      ))
    ) {
      throw 'powershell extension not found'
    }
    await commands.executeCommand(
      'workbench.extensions.installExtension',
      'ms-vscode.powershell',
    )
    powershellExtension = extensions.getExtension<IPowerShellExtensionClient>(
      'ms-vscode.powershell',
    )!
  }
  if (!powershellExtension.isActive) {
    await powershellExtension.activate()
  }
  const powerShellExtensionClient = powershellExtension.exports
  const extensionId = powerShellExtensionClient.registerExternalExtension(
    context.extension.id,
  )
  await powerShellExtensionClient.waitUntilStarted(extensionId)
  let terminal = window.terminals.find(
    (t) =>
      t.creationOptions.name === 'PowerShell Extension' && t.shellIntegration,
  )
  if (!terminal) {
    await commands.executeCommand('PowerShell.ShowSessionConsole')
    terminal = window.activeTerminal!
  }
  await Array.fromAsync(
    terminal
      .shellIntegration!.executeCommand('&', [
        context.asAbsolutePath('resources/registerEditorCommands.ps1'),
        '-IpcPath',
        ipcPath,
      ])
      .read(),
  )
  context.subscriptions.push(
    window.onDidOpenTerminal((t) => {
      // session restarted
      if (t.creationOptions.name === 'PowerShell Extension') {
        let times = 0
        const event = window.onDidChangeTerminalShellIntegration((e) => {
          if (e.terminal !== t || !times++) {
            return // not available to exec
          }
          event.dispose()
          e.shellIntegration.executeCommand('&', [
            context.asAbsolutePath('resources/registerEditorCommands.ps1'),
            '-IpcPath',
            ipcPath,
          ])
        })
      }
    }),
  )
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
