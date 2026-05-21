import {
  transformCaseHelper,
  WordCaseShort,
  type WordCase,
} from '@/util/transformCaseHelper'
import {
  window,
  type QuickPickItem,
  type TextEditor,
  type TextEditorEdit,
} from 'vscode'

function transformCaseAtSelections(
  editor: TextEditor,
  edit: TextEditorEdit,
  wc: WordCase,
) {
  const { document, selections } = editor

  for (const selectionRange of selections) {
    if (selectionRange.isEmpty) {
      const range = document.getWordRangeAtPosition(selectionRange.start)
      if (range) {
        edit.replace(range, transformCaseHelper(document.getText(range), wc))
      }
    } else {
      edit.replace(
        selectionRange,
        transformCaseHelper(document.getText(selectionRange), wc),
      )
    }
  }
}

async function pickWordCase({ document, selection }: TextEditor) {
  const range = selection.isEmpty
    ? document.getWordRangeAtPosition(selection.start)
    : selection
  if (!range) {
    return
  }
  const word = document.getText(range)
  const item = await window.showQuickPick(
    Object.entries(WordCaseShort).map(
      ([wc, short]) =>
        ({
          label: short,
          description: wc + ' : ' + transformCaseHelper(word, wc as WordCase),
        }) as QuickPickItem,
    ),
    {
      title: 'Transform Case',
    },
  )
  if (item) {
    return Object.entries(WordCaseShort).find(
      (e) => e[1] === item.label,
    )![0] as WordCase
  }
}

export async function transformCaseWithPicker() {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }
  const wc = await pickWordCase(editor)
  if (!wc) {
    return
  }
  await editor.edit((edit) => transformCaseAtSelections(editor, edit, wc))
}
