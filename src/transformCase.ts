import {
  Range,
  TextEditor,
  TextEditorEdit,
  WorkspaceEdit,
  commands,
  window,
  workspace,
  type QuickPickItem,
} from 'vscode'
import { getExtConfig } from './config'
import {
  WordCase,
  casesList,
  transformCaseHelper,
} from './util/transformCaseHelper'

export function transformCase(
  editor: TextEditor,
  edit: TextEditorEdit,
  wc?: WordCase,
) {
  wc ??= getExtConfig('transformCase.defaultCase', editor.document)
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

export async function transformCaseWithPicker() {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }
  const defaultWc = getExtConfig('transformCase.defaultCase', editor.document)
  await window
    .showQuickPick(
      casesList.map(
        (wc) =>
          ({ label: wc, picked: wc === defaultWc }) satisfies QuickPickItem,
      ),
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
  const { document, selections } = editor

  try {
    for (const selectionRange of selections) {
      const { placeholder, range } = await commands.executeCommand<{
        range: Range
        placeholder: string
      }>('vscode.prepareRename', document.uri, selectionRange.start)
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
    }
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
    { title: 'Rename Case' },
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
