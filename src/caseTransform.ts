import vscode from 'vscode'
import { WordCase, caseTransform } from './utils/caseTransformHelper'
import { execPrepareRename, execRename } from './utils/commandManager'

export function registerCaseTransform({
  subscriptions,
}: vscode.ExtensionContext) {
  const { registerCommand } = vscode.commands
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
      registerCommand(
        `mvext.transformTo${wc[0].toUpperCase() + wc.substring(1)}`,
        () => dispatch(wc),
      ),
    )
  }
}

async function dispatch(targetWc: WordCase) {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  const { document, selections } = editor

  if (selections.length < 2 && selections[0].isEmpty) {
    const position = selections[0].start

    if (document.languageId === 'javascript') {
      try {
        await vscode.workspace.applyEdit(
          await execRename(
            document.uri,
            position,
            caseTransform(
              (await execPrepareRename(document.uri, position)).placeholder,
              targetWc,
            ),
          ),
        )
        return
      } catch {
        /* empty */
      }
    }
    const range = getExtWordRange(document, position)
    if (range) {
      await editor.edit((b) => {
        b.replace(range, caseTransform(document.getText(range), targetWc))
      })
    }
    return
  }

  await editor.edit((b) => {
    for (const selectionIt of selections) {
      if (selectionIt.isEmpty) {
        const range = getExtWordRange(document, selectionIt.start)
        if (range) {
          b.replace(range, caseTransform(document.getText(range), targetWc))
        }
        continue
      }
      b.replace(
        selectionIt,
        caseTransform(document.getText(selectionIt), targetWc),
      )
    }
  })
}

export function getExtWordRange(
  document: vscode.TextDocument,
  position: vscode.Position,
) {
  return document.getWordRangeAtPosition(position, getExtWordRange.reExtWord)
}
getExtWordRange.reExtWord = /[a-zA-Z_\-./$][\w_\-./$]*/
