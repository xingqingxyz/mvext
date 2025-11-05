import { type ExtensionContext } from 'vscode'
import { createClient } from './client'
import { registerCommands } from './commands'
import { registerExtensionSchemas } from './tomlValidation'

export async function activate(context: ExtensionContext) {
  await createClient(context)
  registerCommands(context)
  registerExtensionSchemas()
}
