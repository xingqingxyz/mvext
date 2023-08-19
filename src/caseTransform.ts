import type {
  Disposable,
  ExtensionContext,
  Position,
  QuickPickItem,
  Selection,
  WorkspaceEdit,
} from 'vscode'
import vscode from 'vscode'
import { caseTransform, WordCase, casesList } from './utils/caseTransformHelper'

const { registerTextEditorCommand, registerCommand, executeCommand } =
  vscode.commands

let subscriptions: Disposable[] = []

export function registerCaseTransform(ctx: ExtensionContext) {
  subscriptions = ctx.subscriptions
  casesList.forEach((wc) => {
    subscriptions.push(
      registerTextEditorCommand(
        `mvext.transformTo${wc[0].toUpperCase() + wc.substring(1)}`,
        (editor) => void dispatch(editor, wc),
      ),
    )
  })
  subscriptions.push(
    registerCommand('mvext.detectTransformCase', dispatchDetect),
  )
}

const reSequence = /[a-zA-Z_\-$][\w_\-$]*/

async function dispatch(editor: vscode.TextEditor, wc: WordCase) {
  const { document, selection, selections } = editor
  if (selections.length < 2 && selection.isEmpty) {
    let transformFn: Parameters<typeof renameWord>[3]
    switch (wc) {
      case 'lowerCase':
        transformFn = (s) => s.toLowerCase()
        break
      case 'upperCase':
        transformFn = (s) => s.toUpperCase()
        break
      default:
        transformFn = caseTransform
        break
    }
    await renameWord(document, selection.start, editor, transformFn, wc)
  } else {
    const rest: Selection[] = []
    await editor.edit(
      (b) => {
        for (const selectionIt of selections) {
          if (selectionIt.isEmpty) {
            const range = document.getWordRangeAtPosition(
              selectionIt.start,
              reSequence,
            )
            if (range) {
              const text = document.getText(range)
              b.replace(range, caseTransform(text, wc))
            }
          } else {
            rest.push(selectionIt)
          }
        }
      },
      { undoStopBefore: true, undoStopAfter: false },
    )
    if (rest.length) {
      await editor.edit(
        (b) => {
          for (const selectionIt of selections) {
            const text = editor.document.getText(selectionIt)
            b.replace(selectionIt, caseTransform(text, wc))
          }
        },
        {
          undoStopBefore: false,
          undoStopAfter: true,
        },
      )
    }
  }
}

async function renameWord(
  document: vscode.TextDocument,
  position: Position,
  editor: vscode.TextEditor,
  transformFn: (word: string, wc: WordCase) => string,
  wc: WordCase,
) {
  const cmdPrepareRename = 'vscode.prepareRename'
  const cmdRenameProvider = 'vscode.executeDocumentRenameProvider'

  try {
    const fileUri = document.uri
    const { placeholder } = await executeCommand<{ placeholder: string }>(
      cmdPrepareRename,
      fileUri,
      position,
    )
    const wspEdit = await executeCommand<WorkspaceEdit>(
      cmdRenameProvider,
      fileUri,
      position,
      transformFn(placeholder, wc),
    )
    await vscode.workspace.applyEdit(wspEdit)
  } catch {
    const range = document.getWordRangeAtPosition(position, reSequence)
    if (range) {
      const text = document.getText(range)
      await editor.edit((b) => {
        b.replace(range, transformFn(text, wc))
      })
    }
  }
}

const caseDetectPickItems: (QuickPickItem & { label: WordCase })[] = [
  {
    label: 'camelCase',
    description: 'loveWorld',
  },
  {
    label: 'titleCase',
    description: 'Love World',
  },
  {
    label: 'constantCase',
    description: 'LOVE_WORLD',
  },
  {
    label: 'dotCase',
    description: 'love.world',
  },
  {
    label: 'headerCase',
    description: 'Love-World',
  },
  {
    label: 'noCase',
    description: 'love world',
  },
  {
    label: 'kebabCase',
    description: 'love-world',
  },
  {
    label: 'pascalCase',
    description: 'LoveWorld',
  },
  {
    label: 'pathCase',
    description: 'love/world',
  },
  {
    label: 'sentenceCase',
    description: 'Love world',
  },
  {
    label: 'snakeCase',
    description: 'love_world',
  },
  {
    label: 'lowerCase',
    description: 'loveworld',
  },
  {
    label: 'upperCase',
    description: 'LOVEWORLD',
  },
]

function showDetectPicks(wc: WordCase) {
  const picks = vscode.window.createQuickPick()
  picks.items = caseDetectPickItems
  picks.placeholder = "Please tell me which case of word you'd like to:"
  picks.title = 'Select Word Case'
  picks.activeItems = [picks.items.find((v) => v.label === wc)!]
  picks.show()

  return new Promise<WordCase>((resolve) =>
    picks.onDidAccept(
      () => {
        resolve(picks.selectedItems[0].label as WordCase)
        picks.dispose()
      },
      undefined,
      subscriptions,
    ),
  )
}

async function dispatchDetect() {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  const { selections, document } = editor
  if (selections[0].isEmpty) {
    return
  }
  const text = document.getText(selections[0])
  const reCaseSplitter = /(\/)|(\.)|(-)|(_)|( )/
  const matches = text.match(reCaseSplitter)

  let wordCase: WordCase
  if (matches) {
    const idx = matches.findIndex((v, i) => v && i)
    switch (idx) {
      case 1:
        wordCase = 'pathCase'
        break
      case 2:
        wordCase = 'dotCase'
        break
      case 3:
        wordCase = 'kebabCase'
        break
      case 4:
        wordCase = 'snakeCase'
        break
      case 5:
        wordCase = 'sentenceCase'
        break
      default:
        wordCase = 'camelCase'
        break
    }

    try {
      const picked = await showDetectPicks(wordCase)
      await editor.edit((edit) => {
        for (const selectionIt of selections) {
          const text = document.getText(selectionIt)
          edit.replace(selectionIt, caseTransform(text, picked))
        }
      })
    } catch {
      /* empty */
    }
  }
}
