import type { ExtensionContext } from 'vscode'
import { Consumer } from './consumer'
import { registerLess } from './less'
import { initModeController } from './modeController'
import { logger } from './util/logger'

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(logger)
  initModeController(context)
  new Consumer(context)
  registerLess(context)
}
