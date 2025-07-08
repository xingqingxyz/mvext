import { commands, type ExtensionContext } from 'vscode'
import { repeatNextLineChar, repeatPrevLineChar } from './commands/insert'
import { Consumer } from './consumer'
import {
  cursorHalfPageDown,
  cursorHalfPageUp,
  manKeyword,
  toggleLessMode,
} from './less'

export async function activate(context: ExtensionContext) {
  const consumer = new Consumer(context)
  context.subscriptions.push(
    commands.registerCommand(
      'vincode.toggleVimMode',
      async (mode?: boolean) => {
        const curMode = consumer.modeController.mode === 'normal'
        mode ??= !curMode
        if (mode === curMode) {
          return
        }
        await consumer.modeController.setMode(mode ? 'normal' : 'insert')
      },
    ),
    ...[
      repeatNextLineChar,
      repeatPrevLineChar,
      cursorHalfPageDown,
      cursorHalfPageUp,
      toggleLessMode,
      manKeyword,
    ].map((f) => commands.registerCommand('vincode.' + f.name, f)),
  )
  console.log(`__DEV__: ${__DEV__}`)
}
