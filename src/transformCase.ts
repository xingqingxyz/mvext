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
import { noop } from './util'
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
  const item = await window.showQuickPick(
    casesList.map(
      (wc) =>
        ({
          label: caseShortMap[wc],
          description: wc + ' : ' + transformCaseHelper(word, wc),
        }) satisfies QuickPickItem,
    ),
    {
      title: 'Transform Case',
    },
  )
  if (item) {
    await editor.edit((edit) =>
      transformCase(
        editor,
        edit,
        Object.entries(caseShortMap).find(
          (e) => e[1] === item.label,
        )![0] as WordCase,
      ),
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
  const { document, selection } = editor
  const result = await commands
    .executeCommand<
      | {
          range: Range
          placeholder: string
        }
      | undefined
    >('vscode.prepareRename', document.uri, selection.active)
    .then(undefined, noop)
  if (!result) {
    return
  }
  const newName = wc
    ? transformCaseHelper(result.placeholder, wc)
    : ((
        await window.showQuickPick(
          casesList.map(
            (wc) =>
              ({
                label: caseShortMap[wc],
                description: transformCaseHelper(result.placeholder, wc),
              }) satisfies QuickPickItem,
          ),
          { title: 'Rename with Case' },
        )
      )?.description ?? result.placeholder)
  const wspEdit = await commands.executeCommand<WorkspaceEdit>(
    'vscode.executeDocumentRenameProvider',
    document.uri,
    result.range.start,
    newName,
  )
  await workspace.applyEdit(wspEdit)
}
