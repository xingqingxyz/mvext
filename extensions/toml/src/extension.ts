import { type ExtensionContext } from 'vscode'
import { client, createClient } from './client'
import { registerCommands } from './commands'
import { registerExtensionSchemas } from './tomlValidation'

export async function activate(context: ExtensionContext) {
  await createClient(context)
  if (client) {
    registerCommands(context)
    registerExtensionSchemas()
  }
}
