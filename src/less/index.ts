import { kebabToPascal } from '@/util'
import { commands, TextEditorCursorStyle, window, workspace } from 'vscode'

let lessMode = false
export async function toggleLessMode(mode?: boolean) {
  const editor = window.activeTextEditor!
  mode ??= !lessMode
  if (lessMode === mode) {
    return
  }
  lessMode = mode
  if (mode) {
    editor.options.cursorStyle = TextEditorCursorStyle.Block
    await commands.executeCommand('workbench.action.toggleZenMode')
  } else {
    editor.options.cursorStyle =
      TextEditorCursorStyle[
        kebabToPascal(
          workspace.getConfiguration('editor').get<string>('cursorStyle')!,
        ) as 'Line'
      ]
    await commands.executeCommand('workbench.action.exitZenMode')
  }
  await commands.executeCommand('setContext', 'vincode.less', mode)
}

export async function manKeyword() {
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
  await commands.executeCommand('workbench.action.terminal.moveToEditor')
  await commands.executeCommand('workbench.action.terminal.focus')
}

export async function cursorHalfPageDown(to = 'down') {
  await commands.executeCommand('editorScroll', {
    to,
    by: 'halfPage',
    revealCursor: true,
  })
}

export function cursorHalfPageUp() {
  return cursorHalfPageDown('up')
}
