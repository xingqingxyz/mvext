import vscode, { ExtensionContext, QuickPickItem, Range, WorkspaceEdit } from 'vscode'
import { WordCase, dispatchNorm, dispatchWord } from './cases'

const cmdPrepareRename = 'vscode.prepareRename'
const cmdRenameProvider = 'vscode.executeDocumentRenameProvider'

let context: ExtensionContext
export const register = (ctx: ExtensionContext) => {
  context = ctx
  for (const wc in dispatchNorm) {
    ctx.subscriptions.push(
      vscode.commands.registerCommand(
        `my-extension.transformTo${wc[0].toUpperCase() + wc.substring(1)}`,
        () => dispatch(wc as WordCase)
      )
    )
  }
}

async function dispatch(wordCase: WordCase) {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }
  const { document, selection, selections } = editor
  if (selections.length < 2 && selection.isEmpty) {
    try {
      const fileUri = document.uri
      const { placeholder } = (await vscode.commands.executeCommand(
        cmdPrepareRename,
        fileUri,
        selection.start
      )) as { range: Range; placeholder: string }
      const wspEdit: WorkspaceEdit = await vscode.commands.executeCommand(
        cmdRenameProvider,
        fileUri,
        selection.start,
        dispatchWord(placeholder, wordCase)
      )
      await vscode.workspace.applyEdit(wspEdit)
    } catch (err) {
      const range = document.getWordRangeAtPosition(selection.start)
      if (range) {
        const text = document.getText(range)
        editor.edit(b => b.replace(range, dispatchWord(text, wordCase)))
      }
    }
    return
  } else {
    let needPick = false
    editor.edit(b => {
      for (const selectionIt of selections) {
        if (selectionIt.isEmpty) {
          const range = document.getWordRangeAtPosition(selectionIt.start)
          if (range) {
            const text = document.getText(range)
            b.replace(range, dispatchWord(text, wordCase))
          }
        } else {
          const text = document.getText(selectionIt)
          const reWeChar = /(\/)|(\.)|(-)|(_)|( )/
          const matches = text.match(reWeChar)

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
                wordCase = 'paramCase'
                break
              case 4:
                wordCase = 'snakeCase'
                break
              case 5:
                wordCase = 'sentenceCase'
              default:
                break
            }
          }
          needPick = true
        }
      }
    })
    if (needPick) {
      const picked = await showPickCase(wordCase)
      if (picked) {
        editor.edit(b => {
          for (const selectionIt of selections) {
            const text = document.getText(selectionIt)
            b.replace(
              selectionIt,
              dispatchWord(
                text
                  .replace(/[^a-zA-Z]+/g, ' ')
                  .trim()
                  .toLowerCase(),
                picked
              )
            )
          }
        })
      }
    }
  }
}

const pickItems: (QuickPickItem & { label: WordCase })[] = [
  {
    label: 'camelCase',
    description: 'loveWorld',
  },
  {
    label: 'capitalCase',
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
    label: 'paramCase',
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
]

const showPickCase = (wc: WordCase) => {
  const picks = vscode.window.createQuickPick()
  picks.items = pickItems
  picks.placeholder = "Please tell me which case of word you'd like to:"
  picks.title = 'Select Word Case'
  const select = picks.items.find(v => v.label === wc)
  if (!select) {
    throw Error('Not met `select` undefined!')
  }
  picks.activeItems = [select]

  const res = new Promise<WordCase | undefined>(resolve => {
    context.subscriptions.push(
      picks.onDidAccept(() => {
        const value = picks.selectedItems[0].label as WordCase
        picks.dispose()
        resolve(value)
      })
    )
  })

  picks.show()
  return res
}
