import { commands, window } from 'vscode'
import which from 'which'
import { modeController } from '../modeController'

/**
 * @key shift+k
 */
export async function manKeyword() {
  const { document, selection } = window.activeTextEditor!
  const args = document
    .getText(
      selection.isEmpty
        ? document.getWordRangeAtPosition(selection.start, /[\w.:-]+(?:\(\d+)?/)
        : selection,
    )
    .split('(', 2)
  if (args.length > 1) {
    args.reverse()
  }
  window.createTerminal('man', await which('man'), args).show()
  await commands.executeCommand('workbench.action.terminal.moveToEditor')
}

/**
 * @key ctrl+y
 */
export function repeatPrevLineChar() {
  const editor = window.activeTextEditor!
  editor.edit(
    (edit) => {
      let text: string
      for (const { active } of editor.selections) {
        if (
          !active.line ||
          active.character >=
            (text = editor.document.lineAt(active.line - 1).text).length
        ) {
          continue
        }
        edit.insert(active, text[active.character])
      }
    },
    { undoStopAfter: false, undoStopBefore: false },
  )
}

/**
 * @key ctrl+e
 */
export function repeatNextLineChar() {
  const editor = window.activeTextEditor!
  editor.edit(
    (edit) => {
      let text: string
      for (const { active } of editor.selections) {
        if (
          active.line + 1 >= editor.document.lineCount ||
          active.character >=
            (text = editor.document.lineAt(active.line + 1).text).length
        ) {
          continue
        }
        edit.insert(active, text[active.character])
      }
    },
    { undoStopAfter: false, undoStopBefore: false },
  )
}

export async function toggleLessMode(mode?: boolean) {
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
