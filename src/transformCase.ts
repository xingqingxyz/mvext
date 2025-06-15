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
  WordCase,
  casesList,
  transformCaseHelper,
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
  return window
    .showQuickPick(
      casesList.map(
        (wc) =>
          ({
            label: wc,
            description: transformCaseHelper(word, wc),
            picked: wc === defaultWc,
          }) satisfies QuickPickItem,
      ),
      {
        title: 'Transform Case',
      },
    )
    .then(
      (item) =>
        item && editor.edit((edit) => transformCase(editor, edit, item.label)),
    )
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
    const newName = wc
      ? transformCaseHelper(placeholder, wc)
      : await showRenameUI(
          placeholder,
          getExtConfig('transformCase.defaultCase', document),
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

async function showRenameUI(curWord: string, preselect?: WordCase) {
  const item = await window.showQuickPick(
    casesList.map(
      (wc) =>
        ({
          label: wc,
          description: transformCaseHelper(curWord, wc),
          picked: preselect === wc,
        }) satisfies QuickPickItem,
    ),
    { title: 'Rename with Case' },
  )
  if (!item) {
    throw new Error('no item selected')
  }
  const value = await window.showInputBox({
    title: 'Rename Symbol',
    placeHolder: 'New name',
    ignoreFocusOut: true,
    value: item.description,
  })
  if (!value) {
    throw new Error('invalid value')
  }
  return value
}
