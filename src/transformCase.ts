import {
  commands,
  window,
  workspace,
  type QuickPickItem,
  type Range,
  type TextEditor,
  type TextEditorEdit,
  type WorkspaceEdit,
} from 'vscode'
import { getExtConfig } from './config'
import {
  transformCaseHelper,
  WordCaseShort,
  type WordCase,
} from './util/transformCaseHelper'

function transformCase(editor: TextEditor, edit: TextEditorEdit, wc: WordCase) {
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

export function transformCaseDefault(editor: TextEditor, edit: TextEditorEdit) {
  transformCase(
    editor,
    edit,
    getExtConfig('transformCase.defaultCase', editor.document),
  )
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
  await editor.edit((edit) => transformCase(editor, edit, wc))
}

/**
 * Display a picker to select case to rename current / multiselected symbol
 */
export async function renameWithCase(wc?: WordCase) {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }
  wc ??= await pickWordCase(editor)
  if (!wc) {
    return
  }
  const {
    document: { uri },
  } = editor
  for (const { active } of editor.selections) {
    try {
      const { placeholder } = await commands.executeCommand<{
        range: Range
        placeholder: string
      }>('vscode.prepareRename', uri, active)
      await workspace.applyEdit(
        await commands.executeCommand<WorkspaceEdit>(
          'vscode.executeDocumentRenameProvider',
          uri,
          active,
          transformCaseHelper(placeholder, wc),
        ),
      )
    } catch {}
  }
}
