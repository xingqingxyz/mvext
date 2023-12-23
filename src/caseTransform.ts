import {
  QuickPickItem,
  Range,
  TextEditor,
  TextEditorEdit,
  WorkspaceEdit,
  commands,
  window,
  workspace,
} from 'vscode'
import { extContext } from './context'
import {
  WordCase,
  caseTransformHelper,
  casesList,
} from './util/caseTransformHelper'

function caseTransform(editor: TextEditor, edit: TextEditorEdit, wc: WordCase) {
  const { document, selections } = editor

  if (selections.length < 2 && selections[0].isEmpty) {
    const position = selections[0].start
    const range = document.getWordRangeAtPosition(position)
    if (range) {
      edit.replace(range, caseTransformHelper(document.getText(range), wc))
    }
    return
  }

  for (const selectionRange of selections) {
    if (selectionRange.isEmpty) {
      const range = document.getWordRangeAtPosition(selectionRange.start)
      if (range) {
        edit.replace(range, caseTransformHelper(document.getText(range), wc))
      }
      continue
    }
    edit.replace(
      selectionRange,
      caseTransformHelper(document.getText(selectionRange), wc),
    )
  }
}

/**
 * Display a picker to select case to rename current / multiselected symbol
 */
async function renameSymbolCase() {
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
      const newName = await showRenameSymbolUI(placeholder)
      if (!newName) {
        return
      }
      const wspEdit = await commands.executeCommand<WorkspaceEdit>(
        'vscode.executeDocumentRenameProvider',
        document.uri,
        range.start,
        newName,
      )
      await workspace.applyEdit(wspEdit)
    }
  } catch {
    return
  }
}

async function showRenameSymbolUI(currentWord: string) {
  const items: QuickPickItem[] = casesList.map((wc) => ({
    label: wc,
    description: caseTransformHelper(currentWord, wc),
  }))
  return (await window.showQuickPick(items, { title: 'Rename Symbol' }))
    ?.description
}

export function register() {
  extContext.subscriptions.push(
    commands.registerCommand('mvext.renameSymbolCase', renameSymbolCase),
    ...casesList.map((wc) =>
      commands.registerTextEditorCommand(
        `mvext.transformTo${wc[0].toUpperCase() + wc.slice(1)}`,
        (editor, edit) => caseTransform(editor, edit, wc),
      ),
    ),
  )
}
