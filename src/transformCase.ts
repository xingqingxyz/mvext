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
  caseShortMap,
  casesList,
  transformCaseHelper,
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
  const { document, selection } = editor
  const range = selection.isEmpty
    ? document.getWordRangeAtPosition(selection.start)
    : selection
  if (!range) {
    return
  }
  const word = document.getText(range)
  const defaultWc = getExtConfig('transformCase.defaultCase', document)
  const item = await window.showQuickPick(
    casesList.map(
      (wc) =>
        ({
          label: caseShortMap[wc],
          detail: wc,
          description: transformCaseHelper(word, wc),
          picked: wc === defaultWc,
        }) satisfies QuickPickItem,
    ),
    {
      title: 'Transform Case',
    },
  )
  if (item) {
    await editor.edit((edit) => transformCase(editor, edit, item.detail))
  }
}

/**
 * Display a picker to select case to rename current / multiselected symbol
 */
export async function renameWithCase(wc?: WordCase) {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }
  const { document, selection } = editor
  try {
    const { placeholder, range } = await commands.executeCommand<{
      range: Range
      placeholder: string
    }>('vscode.prepareRename', document.uri, selection.start)
    const preselect = getExtConfig('transformCase.defaultCase', document)
    const newName = wc
      ? transformCaseHelper(placeholder, wc)
      : await window.showQuickPick(
          casesList.map(
            (wc) =>
              ({
                label: caseShortMap[wc],
                detail: wc,
                description: transformCaseHelper(placeholder, wc),
                picked: preselect === wc,
              }) satisfies QuickPickItem,
          ),
          { title: 'Rename with Case' },
        )
    const wspEdit = await commands.executeCommand<WorkspaceEdit>(
      'vscode.executeDocumentRenameProvider',
      document.uri,
      range.start,
      newName,
    )
    await workspace.applyEdit(wspEdit)
  } catch {}
}
