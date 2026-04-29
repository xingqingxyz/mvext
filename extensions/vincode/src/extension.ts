import { commands, type ExtensionContext } from 'vscode'
import {
  manKeyword,
  repeatNextLineChar,
  repeatPrevLineChar,
  toggleLessMode,
} from './commands'
import { Consumer } from './consumer'
import { initModeController } from './modeController'
import { logger } from './util/logger'

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(
    logger,
    // keep names
    ...Object.entries({
      manKeyword,
      repeatNextLineChar,
      repeatPrevLineChar,
      toggleLessMode,
    }).map(([k, v]) => commands.registerCommand('vincode.' + k, v)),
  )
  initModeController(context)
  new Consumer(context)
}
