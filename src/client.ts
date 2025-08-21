import fs from 'fs/promises'
import { type ExtensionContext, languages, window, workspace } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import which from 'which'
import { getExtConfig } from './config'
import { showMessage } from './logger'

export let client: LanguageClient

export async function createClient(context: ExtensionContext) {
  await workspace.fs.createDirectory(context.globalStorageUri)
  const clientStatusBarItem = languages.createLanguageStatusItem(
    'toml-schema',
    {
      language: 'toml',
      scheme: 'file',
    }
  )
  clientStatusBarItem.name = 'TOML schema'
  clientStatusBarItem.text = 'no schema selected'
  clientStatusBarItem.command = {
    command: 'toml.selectSchema',
    title: 'Select Schema',
  }
  let taploPath = getExtConfig('taplo.path')
  try {
    await fs.access(taploPath, fs.constants.X_OK)
  } catch {
    taploPath = await which('taplo')
  }
  client = new LanguageClient(
    'toml',
    'TOML',
    {
      command: taploPath,
      args: ['lsp', 'stdio', ...getExtConfig('taplo.extraArgs')],
    },
    {
      documentSelector: [{ scheme: 'file', language: 'toml' }],
      initializationOptions: {
        configurationSection: 'toml',
        cachePath: context.globalStorageUri.fsPath,
      },
    }
  )
  console.log(client.state)
  await client.start()
  console.log(client.state)
  context.subscriptions.push(
    client,
    clientStatusBarItem,
    client.onNotification('taplo/messageWithOutput', (params) =>
      showMessage(params.kind, params.message)
    ),
    client.onNotification(
      'taplo/didChangeSchemaAssociation',
      (params: {
        documentUri: string
        schemaUri?: string
        meta?: Record<string, any>
      }) => {
        if (
          params.documentUri ===
          window.activeTextEditor!.document.uri.toString()
        ) {
          clientStatusBarItem.text =
            params.meta?.name ?? params.schemaUri ?? 'no schema selected'
        }
      }
    )
  )
}
