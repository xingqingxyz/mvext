import { execFile } from 'child_process'
import util from 'util'
import vscode, { ExtensionContext } from 'vscode'
import { cfgEvalWithSelection } from './utils/getExtConfig'
import { mjsEval, cjsEval } from './utils/jsEval'

const execFilePm = util.promisify(execFile)

export type LangId = 'cjs' | 'mjs' | 'deno' | 'pwsh' | 'cmd' | 'bash'

export function registerEvalWithSelection(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'mvext.evalWithSelection',
      evalWithSelection,
    ),
  )
}

export async function evalWithSelection() {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  const { selections, document } = editor
  if (selections[0].isEmpty) {
    return
  }

  const selectMap = new Map<vscode.Selection, string>()
  for (const selectionIt of selections) {
    if (selectionIt.isEmpty) {
      continue
    }
    const text = document.getText(selectionIt)
    const langId = matchLangId(document.languageId, text)
    selectMap.set(selectionIt, await evalByLangId(text, langId))
  }
  await editor.edit((edit) => {
    selectMap.forEach((result, selectionIt) => {
      edit.replace(selectionIt, result)
    })
  })
}

function formatObj(result: unknown) {
  switch (typeof result) {
    case 'object':
      return util.format('%o', result)
    case 'function':
      return util.format('%o', result) + '\n' + result.toString()
    default:
      return String(result)
  }
}

export async function evalByLangId(text: string, langId: LangId) {
  switch (langId) {
    case 'cjs':
      return formatObj(await cjsEval(text))
    case 'mjs':
      return formatObj(await mjsEval(text))
    case 'deno': {
      const result = await execFilePm(langId, ['eval', '-p', text])
      return result.stdout
    }
    case 'pwsh': {
      const result = await execFilePm(langId, ['-NoProfile', '-C', text])
      return result.stdout
    }
    case 'bash': {
      const bashExec: string =
        cfgEvalWithSelection().get<string>('bashExecutable') ?? 'bash'
      const result = await execFilePm(bashExec, ['-c', text])
      return result.stdout
    }
    case 'cmd': {
      const result = await execFilePm(langId, [
        '/C',
        text.replace(/\\n/g, ' && '),
      ])
      return result.stdout
    }
    default:
      throw Error('Not identified langId: ' + (langId as string))
  }
}

const reJs = /(?:java|type)script|vue|svelte/
const reMjs = /^import\s+.*?\s+from\s+(['"]).*?\1\s*$/m
function matchLangId(editorLangId: string, text: string): LangId {
  if (reJs.test(editorLangId)) {
    const useDeno = cfgEvalWithSelection().get<boolean>('useDeno')
    return useDeno ? 'deno' : reMjs.test(text) ? 'mjs' : 'cjs'
  }
  switch (editorLangId) {
    case 'powershell':
      return 'pwsh'
    case 'bat':
      return 'cmd'
    case 'shellscript':
      return 'bash'
    default:
      throw Error('Not supported editorLangId: ' + editorLangId)
  }
}
