import { commands, window, type ExtensionContext } from 'vscode'
import { repeatNextLineChar, repeatPrevLineChar } from './commands/insert'
import { modeController } from './modeController'

async function toggleLessMode(mode?: boolean) {
  const inLess = modeController.mode === 'less'
  mode ??= !inLess
  if (mode === inLess) {
    return
  }
  if (mode) {
    await modeController.setMode('less')
  } else {
    await modeController.restoreMode()
  }
}

async function manKeyword() {
  const { document, selection } = window.activeTextEditor!
  let keyword = document.getText(
    selection.isEmpty
      ? document.getWordRangeAtPosition(selection.start, /[\w.:-]+(?:\(\d+\))?/)
      : selection,
  )
  let section
  ;[keyword, section] = keyword.split('(')
  section = section === undefined ? '' : section.slice(0, -1)
  keyword = `man ${section} ${keyword}`
  const terminal = window.activeTerminal ?? window.createTerminal()
  if (terminal.shellIntegration) {
    terminal.shellIntegration.executeCommand(keyword)
  } else {
    terminal.sendText(keyword)
  }
  terminal.show()
  await commands.executeCommand('workbench.action.terminal.moveToEditor')
}

async function cursorHalfPageDown(to = 'down') {
  await commands.executeCommand('editorScroll', {
    to,
    by: 'halfPage',
    revealCursor: true,
  })
}

function cursorHalfPageUp() {
  return cursorHalfPageDown('up')
}

export function registerLess(context: ExtensionContext) {
  context.subscriptions.push(
    ...[
      repeatNextLineChar,
      repeatPrevLineChar,
      cursorHalfPageDown,
      cursorHalfPageUp,
      toggleLessMode,
      manKeyword,
    ].map((f) => commands.registerCommand('vincode.' + f.name, f)),
  )
}
