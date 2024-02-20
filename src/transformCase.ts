import {
  Range,
  TextEditor,
  TextEditorEdit,
  WorkspaceEdit,
  commands,
  window,
  workspace,
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
  wc ??= getExtConfig('transformCase.targetCase', editor.document)
  const { document, selections } = editor

  if (selections.length < 2 && selections[0].isEmpty) {
    const position = selections[0].start
    const range = document.getWordRangeAtPosition(position)
    if (range) {
      edit.replace(range, transformCaseHelper(document.getText(range), wc))
    }
    return
  }

  for (const selectionRange of selections) {
    if (selectionRange.isEmpty) {
      const range = document.getWordRangeAtPosition(selectionRange.start)
      if (range) {
        edit.replace(range, transformCaseHelper(document.getText(range), wc))
      }
      continue
    }
    edit.replace(
      selectionRange,
      transformCaseHelper(document.getText(selectionRange), wc),
    )
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
  const { document, selections } = editor

  try {
    for (const selectionRange of selections) {
      const { placeholder, range } = await commands.executeCommand<{
        range: Range
        placeholder: string
      }>('vscode.prepareRename', document.uri, selectionRange.start)
      const newName = wc
        ? transformCaseHelper(placeholder, wc)
        : await showRenameUI(placeholder)
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

async function showRenameUI(currentWord: string) {
  const item = await window.showQuickPick(
    casesList.map((wc) => ({
      label: wc,
      description: transformCaseHelper(currentWord, wc),
    })),
    { title: 'Rename' },
  )
  if (item === undefined) {
    throw new Error('No case selected')
  }
  const value = await window.showInputBox({
    title: 'Rename',
    placeHolder: 'New name',
    ignoreFocusOut: true,
    value: item.description,
  })
  if (value === undefined) {
    throw new Error('User canceled')
  }
  return value
}
