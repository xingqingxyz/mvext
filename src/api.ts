import changeCase = require('change-case')
import vscode, { TextEditor } from 'vscode'

type AllCases =
  | 'capitalCase'
  | 'camelCase'
  | 'constantCase'
  | 'pascalCase'
  | 'paramCase'
  | 'snakeCase'
  | 'sentenceCase'
  | 'dotCase'
  | 'pathCase'
  | 'headerCase'
  | 'noCase'
const commandsInfo: { command: string; id: AllCases }[] = [
  {
    command: 'my-extension.transformToTitleCase',
    id: 'capitalCase',
  },
  {
    command: 'my-extension.transformToCamelCase',
    id: 'camelCase',
  },
  {
    command: 'my-extension.transformToConstantCase',
    id: 'constantCase',
  },
  {
    command: 'my-extension.transformToPascalCase',
    id: 'pascalCase',
  },
  {
    command: 'my-extension.transformToKebabCase',
    id: 'paramCase',
  },
  {
    command: 'my-extension.transformToSnakeCase',
    id: 'snakeCase',
  },
  {
    command: 'my-extension.transformToDotCase',
    id: 'dotCase',
  },
  {
    command: 'my-extension.transformToPathCase',
    id: 'pathCase',
  },
  {
    command: 'my-extension.transformToSentenceCase',
    id: 'sentenceCase',
  },
  {
    command: 'my-extension.transformToNomralCase',
    id: 'noCase',
  },
  {
    command: 'my-extension.transformToHeaderCase',
    id: 'headerCase',
  },
]
export const registers = commandsInfo.map(info => ({
  command: info.command,
  callback: () => runCommandById(info.id),
}))
function runCommandById(id: AllCases) {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }
  if (editor.selections.length === 1) {
    transformOneSelection(editor, id)
  } else {
    transformMultiSelection(editor, id)
  }
}
function transformOneSelection(editor: TextEditor, id: AllCases) {
  const { document, selection } = editor
  editor.edit(editBuilder => {
    const range = selection.isEmpty
      ? document.getWordRangeAtPosition(selection.active)
      : selection
    if (!range) {
      return
    }
    editBuilder.replace(range, dispatch(document.getText(range), id))
  })
}
function transformMultiSelection(editor: TextEditor, id: AllCases) {
  const { document, selections } = editor
  editor.edit(editBuilder => {
    for (const selectionIt of selections) {
      const range = selectionIt.isEmpty
        ? document.getWordRangeAtPosition(selectionIt.active)
        : selectionIt
      if (!range) {
        return
      }
      editBuilder.replace(range, dispatch(document.getText(range), id))
    }
  })
}
function dispatch(sequence: string, id: AllCases) {
  return changeCase[id](sequence)
}
export function rigisterKeyBindings() {
  vscode
}
