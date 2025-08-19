import { type ExtensionContext, StatusBarAlignment, window } from 'vscode'
import { createClient } from './client'
import { registerCommands } from './commands'
import { syncExtensionSchemas } from './tomlValidation'
import { getOutput, showMessage } from './util'

export async function activate(context: ExtensionContext) {
  const schemaIndicator = window.createStatusBarItem(
    StatusBarAlignment.Right,
    0
  )
  schemaIndicator.text = 'no schema selected'
  schemaIndicator.tooltip = 'TOML Schema'
  schemaIndicator.command = 'toml.selectSchema'
  const client = await createClient(context)
  await client.start()
  if (window.activeTextEditor?.document.languageId === 'toml') {
    schemaIndicator.show()
  }
  registerCommands(context, client)
  syncExtensionSchemas(context, client)
  context.subscriptions.push(
    getOutput(),
    schemaIndicator,
    client.onNotification('taplo/messageWithOutput', async (params) =>
      showMessage(params, client)
    ),
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document.languageId === 'toml') {
        schemaIndicator.show()
      } else {
        schemaIndicator.hide()
      }
    }),
    client.onNotification(
      'taplo/didChangeSchemaAssociation',
      async (params: {
        documentUri: string
        schemaUri?: string
        meta?: Record<string, any>
      }) => {
        const currentDocumentUrl =
          window.activeTextEditor?.document.uri.toString()

        if (!currentDocumentUrl) {
          return
        }

        if (params.documentUri === currentDocumentUrl) {
          schemaIndicator.text =
            params.meta?.name ?? params.schemaUri ?? 'no schema selected'
        }
      }
    )
  )
}
