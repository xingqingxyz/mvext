import { type ExtensionContext } from 'vscode'
import { Consumer } from './consumer'
import { registerLess } from './less'
import { initModeController } from './modeController'

export async function activate(context: ExtensionContext) {
  initModeController(context)
  new Consumer(context)
  registerLess(context)
}
