import vscode from 'vscode'
import { WordCase, caseTransform } from './utils/caseTransformHelper'

export function registerCaseTransform({
  subscriptions,
}: vscode.ExtensionContext) {
  const { registerTextEditorCommand } = vscode.commands
  const casesList = [
    'lowerCase',
    'upperCase',
    'dotCase',
    'pathCase',
    'snakeCase',
    'kebabCase',
    'noCase',
    'sentenceCase',
    'constantCase',
    'pascalCase',
    'camelCase',
    'titleCase',
    'headerCase',
  ] as const

  for (const wc of casesList) {
    subscriptions.push(
      registerTextEditorCommand(
        `mvext.transformTo${wc[0].toUpperCase() + wc.slice(1)}`,
        (editor, edit) => dispatch(editor, edit, wc),
      ),
    )
  }
}

function dispatch(
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  targetWc: WordCase,
) {
  const { document, selections } = editor

  if (selections.length < 2 && selections[0].isEmpty) {
    const position = selections[0].start
    const range = getExtWordRange(document, position)
    if (range) {
      edit.replace(range, caseTransform(document.getText(range), targetWc))
    }
    return
  }

  for (const selectionIt of selections) {
    if (selectionIt.isEmpty) {
      const range = getExtWordRange(document, selectionIt.start)
      if (range) {
        edit.replace(range, caseTransform(document.getText(range), targetWc))
      }
      continue
    }
    edit.replace(
      selectionIt,
      caseTransform(document.getText(selectionIt), targetWc),
    )
  }
}

const reExtWord = /[a-zA-Z_\-./$][\w_\-./$]*/
export function getExtWordRange(
  document: vscode.TextDocument,
  position: vscode.Position,
) {
  return document.getWordRangeAtPosition(position, reExtWord)
}
