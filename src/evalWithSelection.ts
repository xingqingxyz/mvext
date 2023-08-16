import vscode, { ExtensionContext } from 'vscode'
import util from 'util'
import { execEval } from './utils/evalWithSelectionHelper'
const { registerTextEditorCommand } = vscode.commands

export type LangId = 'javascript' | 'python' | 'lua' | 'pwsh' | 'cmd' | 'bash'

export function registerEvalWithSelection(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    registerTextEditorCommand('mvext.evalWithSelection', evalWithSelection)
  )
}

export function evalWithSelection(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit
) {
  const { selections, document } = textEditor
  const resourceLangId = document.languageId as LangId
  for (const selectionIt of selections) {
    try {
      evalByLangId(document.getText(selectionIt), resourceLangId)
    } catch (err) {
      console.error(err)
    }
    const result = ''
    edit.replace(selectionIt, result)
  }
}

export function evalByLangId(text: string, langId: LangId) {
  switch (langId) {
    case 'javascript': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = eval(text)
      switch (typeof result) {
        case 'object':
          return util.format('%o', result)
        default:
          return '' + result
      }
    }
    case 'pwsh':
    case 'bash':
      return execEval(langId, ['-c', text])
    case 'cmd':
      return execEval(langId, ['/C', text])
    case 'python':
    case 'lua':
      return execEval(langId, ['-e', text])
    default:
      throw Error('Not identified langId: ' + (langId as string))
  }
}
