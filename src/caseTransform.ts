import vscode from 'vscode'
import { WordCase, caseTransform, casesList } from './utils/caseTransformHelper'
import { execPrepareRename, execRename } from './utils/commandManager'

export function registerCaseTransform({
  subscriptions,
}: vscode.ExtensionContext) {
  const { registerCommand } = vscode.commands
  for (const wc of casesList) {
    subscriptions.push(
      registerCommand(
        `mvext.transformTo${wc[0].toUpperCase() + wc.substring(1)}`,
        () => dispatch(wc),
      ),
    )
  }
  subscriptions.push(
    registerCommand('mvext.detectTransformCase', dispatchDetect),
  )
}

async function dispatch(targetWc: WordCase) {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  const { document, selections } = editor

  if (selections.length < 2 && selections[0].isEmpty) {
    const position = selections[0].start
    const { placeholder } = await execPrepareRename(document.uri, position)
    try {
      await vscode.workspace.applyEdit(
        await execRename(
          document.uri,
          position,
          caseTransform(placeholder, targetWc),
        ),
      )
    } catch {
      const range = getJsWordRange(document, position)
      if (range) {
        await editor.edit((b) => {
          b.replace(range, caseTransform(document.getText(range), targetWc))
        })
      }
    }
    return
  }

  await editor.edit((b) => {
    for (const selectionIt of selections) {
      if (selectionIt.isEmpty) {
        const range = getJsWordRange(document, selectionIt.start)
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

function getJsWordRange(
  document: vscode.TextDocument,
  position: vscode.Position,
) {
  return document.getWordRangeAtPosition(position, getJsWordRange.reJsWord)
}
getJsWordRange.reJsWord = /[a-zA-Z_\-$][\w_\-$]*/

const caseDetectPickItems: (vscode.QuickPickItem & { label: WordCase })[] = [
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

const picks = vscode.window.createQuickPick()
picks.items = caseDetectPickItems
picks.placeholder = vscode.l10n.t(
  "Please tell me which case of word you'd like to:",
)
picks.title = vscode.l10n.t('Select Word Case')

function showDetectPicks(wc: WordCase) {
  picks.activeItems = [picks.items.find((v) => v.label === wc)!]
  picks.show()

  return new Promise<WordCase>((resolve, reject) => {
    const events = [
      picks.onDidAccept(() => {
        resolve(picks.selectedItems[0].label as WordCase)
        picks.hide()
        for (const event of events) {
          event.dispose()
        }
      }),
      picks.onDidHide(() => {
        reject()
        picks.hide()
        for (const event of events) {
          event.dispose()
        }
      }),
    ]
  })
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
