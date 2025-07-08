import { window } from 'vscode'

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
