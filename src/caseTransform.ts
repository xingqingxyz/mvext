import { ExtensionContext, TextEditor, TextEditorEdit, commands } from 'vscode'
import {
  WordCase,
  caseTransformHelper,
  joinCaseActions,
} from './utils/caseTransformHelper'

export function registerCaseTransform(ctx: ExtensionContext) {
  const { registerTextEditorCommand } = commands
  const casesList = Object.keys(joinCaseActions).concat(
    'lowerCase',
    'upperCase',
  ) as WordCase[]

  ctx.subscriptions.push(
    ...casesList.map((wc) =>
      registerTextEditorCommand(
        `mvext.transformTo${wc[0].toUpperCase() + wc.slice(1)}`,
        (editor, edit) => caseTransform(editor, edit, wc),
      ),
    ),
  )
}

function caseTransform(
  editor: TextEditor,
  edit: TextEditorEdit,
  targetWc: WordCase,
) {
  const { document, selections } = editor

  if (selections.length < 2 && selections[0].isEmpty) {
    const position = selections[0].start
    const range = document.getWordRangeAtPosition(position)
    if (range) {
      edit.replace(
        range,
        caseTransformHelper(document.getText(range), targetWc),
      )
    }
    return
  }

  for (const selectionIt of selections) {
    if (selectionIt.isEmpty) {
      const range = document.getWordRangeAtPosition(selectionIt.start)
      if (range) {
        edit.replace(
          range,
          caseTransformHelper(document.getText(range), targetWc),
        )
      }
      continue
    }
    edit.replace(
      selectionIt,
      caseTransformHelper(document.getText(selectionIt), targetWc),
    )
  }
}
